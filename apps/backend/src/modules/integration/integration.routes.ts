// packages/backend/src/modules/integration/integration.routes.ts
//
// Endpoints:
//
//   GET    /integrations/status               → full provider catalogue for current user
//   GET    /integrations/google/connect       → redirect to Google OAuth consent screen
//   GET    /integrations/google/callback      → OAuth callback (Google redirects here)
//   DELETE /integrations/:provider/disconnect → revoke & remove a connected provider
//   GET    /integrations/automation           → get automation settings
//   PATCH  /integrations/automation           → update (partial) automation settings
//   GET    /integrations/google/calendar      → upcoming calendar events

import { Router, Request, Response, NextFunction } from "express";
import { requireAuth }          from "../auth/auth.middleware";
import { buildGoogleAuthUrl, handleGoogleCallback, getUpcomingEvents } from "./google.service";
import {
  getProviderCatalogue,
  getAutomationSettings,
  updateAutomationSettings,
  disconnectProvider,
} from "./integration.service";
import { PROVIDERS, type Provider } from "./integration.model";

const router = Router();

// ── Auth guard on all integration routes ─────────────────────────────────────
// Exception: /google/callback — Google redirects here without our session
// cookie, so we extract userId from the signed state param instead.
router.use((req, res, next) => {
  if (req.path === "/google/callback") return next(); // handled inside the route
  requireAuth(req, res, next);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /integrations/status
// Returns the provider catalogue (connected, available, coming_soon) for the
// current user, plus their current automation settings.
// ─────────────────────────────────────────────────────────────────────────────

router.get("/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [providers, automation] = await Promise.all([
      getProviderCatalogue(req.user.id),
      getAutomationSettings(req.user.id),
    ]);

    res.json({ providers, automation });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /integrations/google/connect
// Redirects the browser to Google's OAuth consent screen.
// ─────────────────────────────────────────────────────────────────────────────

router.get("/google/connect", (req: Request, res: Response) => {
  const url = buildGoogleAuthUrl(req.user.id);
  res.redirect(url);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /integrations/google/callback
// Google redirects here after the user grants (or denies) access.
// We exchange the code for tokens, then redirect the user back to the frontend.
// ─────────────────────────────────────────────────────────────────────────────

router.get("/google/callback", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error } = req.query as Record<string, string | undefined>;

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

    // User denied access
    if (error) {
      return res.redirect(`${frontendUrl}/integrations?error=google_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/integrations?error=google_invalid_callback`);
    }

    await handleGoogleCallback(code, state);

    // Redirect back to the integrations page with a success flag
    res.redirect(`${frontendUrl}/dashboard/integrations?connected=google`);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /integrations/:provider/disconnect
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
  "/:provider/disconnect",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = req.params.provider as Provider;

      if (!PROVIDERS.includes(provider)) {
        res.status(400).json({ error: `Unknown provider: ${provider}` });
        return;
      }

      await disconnectProvider(req.user.id, provider);
      res.json({ disconnected: true, provider });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /integrations/automation
// ─────────────────────────────────────────────────────────────────────────────

router.get("/automation", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const automation = await getAutomationSettings(req.user.id);
    res.json(automation);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /integrations/automation
// Body: Partial<IAutomationSettings> — only send the keys you want to change.
// ─────────────────────────────────────────────────────────────────────────────

router.patch("/automation", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ALLOWED_KEYS = [
      "autoSummarize",
      "autoEmailSummary",
      "autoImportCalendar",
      "autoStartRecording",
    ] as const;

    // Whitelist the update payload so clients can't inject arbitrary fields
    const updates: Record<string, boolean> = {};
    for (const key of ALLOWED_KEYS) {
      if (key in req.body && typeof req.body[key] === "boolean") {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No valid automation fields provided." });
      return;
    }

    const automation = await updateAutomationSettings(req.user.id, updates);
    res.json(automation);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /integrations/google/calendar
// Query params:
//   daysAhead   (default: 7)   — how many days ahead to look
//   maxResults  (default: 20)  — max events to return
// ─────────────────────────────────────────────────────────────────────────────

router.get("/google/calendar", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const daysAhead  = Math.min(Number(req.query.daysAhead)  || 7,  30);
    const maxResults = Math.min(Number(req.query.maxResults) || 20, 50);

    const events = await getUpcomingEvents(req.user.id, daysAhead, maxResults);
    res.json({ events });
  } catch (err: unknown) {
    // Surface a clear 403 if Google isn't connected
    if (err instanceof Error && err.message === "Google account not connected.") {
      res.status(403).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;