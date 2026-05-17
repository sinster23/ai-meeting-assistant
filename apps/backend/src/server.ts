// packages/backend/src/server.ts
//
// Changes vs original:
//   • Mounts Better Auth on /api/auth/*
//   • CORS updated: credentials: true (required for cookie-based sessions)
//   • Auth routes registered BEFORE express.json() — Better Auth parses its
//     own bodies internally

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import meetingRoutes   from "./modules/meeting/meeting.routes";
import recordingRoutes from "./modules/recording/recording.routes";
import uploadRoutes    from "./modules/upload/upload.routes";
import searchRouter    from "./modules/search/search.routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./modules/auth/auth.config";


const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────
// credentials: true is REQUIRED for cookies (session tokens) to be sent
// cross-origin. The frontend must also use `credentials: "include"` in fetch.

app.use(
  cors({
    origin:      process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,   // ← must be true for auth cookies
  })
);

// ── Auth routes (before express.json) ─────────────────────────────────────
// Better Auth handles its own body parsing. Register before express.json()
// so the raw stream isn't consumed first.

app.all("/api/auth/*", toNodeHandler(auth));

// ── Body parsing (all other routes) ──────────────────────────────────────
app.use(express.json());

// ── App routes ────────────────────────────────────────────────────────────
app.use("/meetings",   meetingRoutes);
app.use("/recordings", recordingRoutes);
app.use("/uploads",    uploadRoutes);
app.use("/search",     searchRouter);

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Central error handler ─────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error && err.message.includes("File too large")) {
    res.status(413).json({ error: "File too large. Maximum size is 100 MB." });
    return;
  }

  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status ?? 500;
    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "An unexpected error occurred." });
});

export default app;