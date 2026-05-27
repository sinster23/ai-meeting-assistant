// packages/backend/src/modules/integration/integration.service.ts

import {
  PROVIDERS,
  Provider,
  UserIntegrationModel,
  IAutomationSettings,
} from "./integration.model";
import { disconnectGoogle } from "./google.service";

// ─────────────────────────────────────────────────────────────────────────────
// Static provider metadata
// ─────────────────────────────────────────────────────────────────────────────

export type ProviderStatus = "connected" | "available" | "coming_soon";

export interface ProviderInfo {
  provider:    Provider;
  name:        string;
  description: string;
  status:      ProviderStatus;
  connectedAt: string | null;
  features:    string[];
}

const PROVIDER_META: Record<
  Provider,
  Pick<ProviderInfo, "name" | "description" | "features">
> = {
  google: {
    name:        "Google Calendar",
    description: "Sync upcoming meetings and auto-import events.",
    features:    ["Upcoming meetings", "Auto-import events", "Meet link detection"],
  },
  slack: {
    name:        "Slack",
    description: "Post meeting summaries and action items to channels.",
    features:    ["Post summaries", "Action item alerts", "Channel routing"],
  },
  zoom: {
    name:        "Zoom",
    description: "Import Zoom cloud recordings automatically.",
    features:    ["Cloud recording import", "Auto-transcription", "Meeting metadata"],
  },
  email: {
    name:        "Email",
    description: "Send meeting summaries directly to attendees.",
    features:    ["Summary emails", "Action item digests", "Attendee list"],
  },
  notion: {
    name:        "Notion",
    description: "Save meeting notes and action items to Notion pages.",
    features:    ["Page creation", "Action item database", "Template support"],
  },
};

const LIVE_PROVIDERS = new Set<Provider>(["google"]);

// ─────────────────────────────────────────────────────────────────────────────
// Internal: getOrCreateUserIntegration
// Always normalises userId to a plain string so ObjectId vs string never
// causes a lookup miss across different parts of the app.
// ─────────────────────────────────────────────────────────────────────────────

async function getOrCreateUserIntegration(userId: string) {
  // Normalise: Mongoose ObjectIds come in as objects; String() makes it "..."
  const userIdStr = String(userId);

  const doc = await UserIntegrationModel.findOneAndUpdate(
    { userId: userIdStr },
    { $setOnInsert: { userId: userIdStr } },
    { upsert: true, new: true, lean: true },
  );

  if (!doc) {
    throw new Error(
      `[integration-service] Failed to upsert UserIntegration for ${userIdStr}`,
    );
  }

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// getProviderCatalogue
// ─────────────────────────────────────────────────────────────────────────────

export async function getProviderCatalogue(userId: string): Promise<ProviderInfo[]> {
  const userIntegration = await getOrCreateUserIntegration(userId);

  const connectedMap = new Map(
    (userIntegration.connected ?? []).map((c: any) => [
      String(c.provider),
      c.connectedAt,
    ]),
  );

  return PROVIDERS.map((provider): ProviderInfo => {
    const connectedAt = connectedMap.get(provider);
    const isConnected = Boolean(connectedAt);
    const isLive      = LIVE_PROVIDERS.has(provider);

    let status: ProviderStatus;
    if (isConnected) status = "connected";
    else if (isLive) status = "available";
    else             status = "coming_soon";

    return {
      provider,
      ...PROVIDER_META[provider],
      status,
      connectedAt: connectedAt ? new Date(connectedAt).toISOString() : null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// getAutomationSettings
// ─────────────────────────────────────────────────────────────────────────────

export async function getAutomationSettings(
  userId: string,
): Promise<IAutomationSettings> {
  const doc = await getOrCreateUserIntegration(userId);
  return doc.automation;
}

// ─────────────────────────────────────────────────────────────────────────────
// updateAutomationSettings
// ─────────────────────────────────────────────────────────────────────────────

export async function updateAutomationSettings(
  userId:  string,
  updates: Partial<IAutomationSettings>,
): Promise<IAutomationSettings> {
  const userIdStr    = String(userId);
  const setPayload: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(updates)) {
    setPayload[`automation.${key}`] = value as boolean;
  }

  const doc = await UserIntegrationModel.findOneAndUpdate(
    { userId: userIdStr },
    { $set: setPayload },
    { upsert: true, new: true, lean: true },
  );

  if (!doc) {
    throw new Error(
      `[integration-service] Failed to update automation settings for ${userIdStr}`,
    );
  }

  return doc.automation;
}

// ─────────────────────────────────────────────────────────────────────────────
// disconnectProvider
// ─────────────────────────────────────────────────────────────────────────────

export async function disconnectProvider(
  userId:   string,
  provider: Provider,
): Promise<void> {
  const userIdStr = String(userId);

  switch (provider) {
    case "google":
      await disconnectGoogle(userIdStr);
      break;

    default:
      await UserIntegrationModel.findOneAndUpdate(
        { userId: userIdStr },
        { $pull: { connected: { provider } } },
      );
      break;
  }
}