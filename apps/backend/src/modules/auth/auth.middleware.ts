// packages/backend/src/modules/auth/auth.middleware.ts
//
// requireAuth — drop this in front of any route that needs a logged-in user.
//
// Usage:
//   import { requireAuth } from "../auth/auth.middleware";
//   router.get("/meetings", requireAuth, async (req, res) => {
//     const userId = req.user.id;   // always present here
//     ...
//   });

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.config";
import type { User } from "./auth.config";

// ── Extend Express Request with session data ──────────────────────────────
// This lets TypeScript know that req.user and req.session exist after the
// middleware runs.

declare global {
  namespace Express {
    interface Request {
      user:    User;
      session: { id: string; userId: string; expiresAt: Date };
    }
  }
}

// ── Core session validation ───────────────────────────────────────────────

/**
 * getSession — resolves the Better Auth session from the incoming request.
 * Returns null if no valid session exists (expired, missing cookie, etc.).
 */
export async function getSession(req: Request) {
  return auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
}

// ── Middleware ────────────────────────────────────────────────────────────

/**
 * requireAuth — 401 if no valid session; otherwise attaches req.user and
 * req.session and calls next().
 *
 * Always use this instead of trusting any userId from the request body or
 * query string — the session is the only trustworthy source of identity.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionData = await getSession(req);

    if (!sessionData?.session || !sessionData?.user) {
      res.status(401).json({ error: "Unauthorized. Please sign in." });
      return;
    }

    // Attach to request for downstream handlers
    req.user    = sessionData.user;
    req.session = {
      id:        sessionData.session.id,
      userId:    sessionData.session.userId,
      expiresAt: sessionData.session.expiresAt,
    };

    next();
  } catch (err) {
    console.error("[auth] Session validation error:", err);
    res.status(500).json({ error: "Internal server error during authentication." });
  }
}

/**
 * optionalAuth — same as requireAuth but does NOT reject unauthenticated
 * requests. Useful for routes that behave differently for logged-in users.
 *
 * Check req.user inside the handler — it will be undefined if not logged in.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionData = await getSession(req);
    if (sessionData?.user && sessionData?.session) {
      req.user    = sessionData.user;
      req.session = {
        id:        sessionData.session.id,
        userId:    sessionData.session.userId,
        expiresAt: sessionData.session.expiresAt,
      };
    }
  } catch {
    // Non-fatal — continue as unauthenticated
  }
  next();
}