// packages/backend/src/modules/integration/google.service.ts
//
// Handles:
//   • Building the Google OAuth consent URL (with HMAC-signed state — CSRF safe)
//   • Exchanging the auth code for tokens
//   • Persisting tokens AES-256-GCM encrypted via token-crypto.ts
//   • Auto-refreshing expired access tokens on use
//   • Fetching upcoming Google Calendar events
//   • Disconnecting (token revoke + DB cleanup)

import { createHmac, timingSafeEqual } from "crypto";
import { OAuth2Client }  from "google-auth-library";
import { google }        from "googleapis";
import { IntegrationTokenModel, UserIntegrationModel } from "./integration.model";
import { encrypt, decrypt } from "./token-crypto";

// ─────────────────────────────────────────────────────────────────────────────
// OAuth2 client factory
// ─────────────────────────────────────────────────────────────────────────────

function makeOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
];

// ─────────────────────────────────────────────────────────────────────────────
// CSRF — HMAC-signed state param
// ─────────────────────────────────────────────────────────────────────────────
// The OAuth `state` value carries the userId so the callback knows whose token
// to save.  We sign it with HMAC-SHA256 so a malicious redirect can't forge a
// state for an arbitrary userId.
//
// Required env var: OAUTH_STATE_SECRET  (any long random string, ≥32 chars)
// Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

function getStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[google-service] OAUTH_STATE_SECRET must be set and at least 32 chars. " +
      "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return secret;
}

/**
 * Builds a signed state string: base64("<payload>.<hmac>")
 * Payload: JSON with userId + nonce (to prevent replay).
 */
function buildSignedState(userId: string): string {
  const payload = JSON.stringify({ userId, nonce: Date.now() });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", getStateSecret())
    .update(payloadB64)
    .digest("hex");
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies and decodes the state param returned by Google.
 * Throws on invalid signature — route handler should treat this as a 400.
 */
function verifySignedState(state: string): { userId: string } {
  const dotIdx = state.lastIndexOf(".");
  if (dotIdx === -1) throw new Error("Malformed OAuth state.");

  const payloadB64 = state.slice(0, dotIdx);
  const receivedSig = state.slice(dotIdx + 1);

  const expectedSig = createHmac("sha256", getStateSecret())
    .update(payloadB64)
    .digest("hex");

  // Constant-time comparison — prevents timing attacks
  const recv = Buffer.from(receivedSig, "hex");
  const expt = Buffer.from(expectedSig,  "hex");
  if (recv.length !== expt.length || !timingSafeEqual(recv, expt)) {
    throw new Error("OAuth state signature is invalid. Possible CSRF attempt.");
  }

  const { userId } = JSON.parse(
    Buffer.from(payloadB64, "base64url").toString("utf-8"),
  ) as { userId: string };

  return { userId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Build the consent URL
// ─────────────────────────────────────────────────────────────────────────────

export function buildGoogleAuthUrl(userId: string): string {
  const client = makeOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt:      "consent", // always return refresh_token
    scope:       GOOGLE_SCOPES,
    state:       buildSignedState(userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Handle the OAuth callback
// ─────────────────────────────────────────────────────────────────────────────

export interface GoogleCallbackResult {
  userId: string;
}

export async function handleGoogleCallback(
  code:  string,
  state: string,
): Promise<GoogleCallbackResult> {
  // Verify HMAC signature — throws on tampering
  const { userId } = verifySignedState(state);

  const client = makeOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }

  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  // Encrypt before persisting
  const encryptedAccess  = encrypt(tokens.access_token);
  const encryptedRefresh = tokens.refresh_token
    ? encrypt(tokens.refresh_token)
    : null;

  // Upsert token doc — single atomic operation
  await IntegrationTokenModel.findOneAndUpdate(
    { userId, provider: "google" },
    {
      $set: {
        accessToken:  encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresAt,
        scope: tokens.scope ?? null,
      },
    },
    { upsert: true, new: true },
  );

  // Atomically remove any existing google entry then push the new one.
  // Using a two-step write (pull then push) is the standard Mongoose approach
  // for updating an item inside an array without full document replacement.
  await UserIntegrationModel.findOneAndUpdate(
    { userId },
    { $pull: { connected: { provider: "google" } } },
    { upsert: true },
  );
  await UserIntegrationModel.findOneAndUpdate(
    { userId },
    { $push: { connected: { provider: "google", connectedAt: new Date() } } },
  );

  return { userId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Token helper — load, decrypt, refresh if needed
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
  // Must explicitly select encrypted fields (they have select:false on the schema)
  const tokenDoc = await IntegrationTokenModel
    .findOne({ userId, provider: "google" })
    .select("+accessToken +refreshToken");

  if (!tokenDoc) throw new Error("Google account not connected.");

  // Decrypt tokens for in-memory use only — never log or return these
  const accessToken  = decrypt(tokenDoc.accessToken);
  const refreshToken = tokenDoc.refreshToken ? decrypt(tokenDoc.refreshToken) : null;

  const client = makeOAuthClient();
  client.setCredentials({
    access_token:  accessToken,
    refresh_token: refreshToken ?? undefined,
    expiry_date:   tokenDoc.expiresAt ? tokenDoc.expiresAt.getTime() : undefined,
  });

  // Refresh proactively if token expires within 60 s
  const expiryMs = tokenDoc.expiresAt?.getTime() ?? 0;
  if (expiryMs - Date.now() < 60_000 && refreshToken) {
    const { credentials } = await client.refreshAccessToken();

    if (credentials.access_token) {
      const newEncryptedAccess = encrypt(credentials.access_token);
      await IntegrationTokenModel.findOneAndUpdate(
        { userId, provider: "google" },
        {
          $set: {
            accessToken: newEncryptedAccess,
            expiresAt:   credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : tokenDoc.expiresAt,
          },
        },
      );
    }

    client.setCredentials(credentials);
  }

  return client;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar — fetch upcoming events
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id:          string;
  title:       string;
  description: string | null;
  startAt:     string;
  endAt:       string;
  location:    string | null;
  meetLink:    string | null;
  attendees:   string[];
  organizer:   string | null;
}

export async function getUpcomingEvents(
  userId:     string,
  daysAhead:  number = 7,
  maxResults: number = 20,
): Promise<CalendarEvent[]> {
  const auth     = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

  const response = await calendar.events.list({
    calendarId:   "primary",
    timeMin,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy:      "startTime",
  });

  return (response.data.items ?? []).map((event): CalendarEvent => {
    const meetLink =
      event.hangoutLink ??
      event.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === "video",
      )?.uri ??
      null;

    return {
      id:          event.id ?? "",
      title:       event.summary ?? "(No title)",
      description: event.description ?? null,
      startAt:     event.start?.dateTime ?? event.start?.date ?? "",
      endAt:       event.end?.dateTime   ?? event.end?.date   ?? "",
      location:    event.location ?? null,
      meetLink,
      attendees:   (event.attendees ?? []).map((a) => a.email ?? "").filter(Boolean),
      organizer:   event.organizer?.email ?? null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Disconnect
// ─────────────────────────────────────────────────────────────────────────────

export async function disconnectGoogle(userId: string): Promise<void> {
  const tokenDoc = await IntegrationTokenModel
    .findOne({ userId, provider: "google" })
    .select("+accessToken");

  if (tokenDoc) {
    // Revoke with Google — best-effort (token may already be expired)
    try {
      const accessToken = decrypt(tokenDoc.accessToken);
      const client      = makeOAuthClient();
      await client.revokeToken(accessToken);
    } catch {
      // Non-fatal
    }

    await IntegrationTokenModel.deleteOne({ userId, provider: "google" });
  }

  await UserIntegrationModel.findOneAndUpdate(
    { userId },
    { $pull: { connected: { provider: "google" } } },
  );
}