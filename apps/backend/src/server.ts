// packages/backend/src/server.ts

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import meetingRoutes from "./modules/meeting/meeting.routes";
import { ensureUploadDir } from "./utils/file";
import { connectDB, disconnectDB } from "./config/db";

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  })
);
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/meetings", meetingRoutes);

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Central error handler ─────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error && err.message.includes("File too large")) {
    res.status(413).json({ error: "File too large. Maximum size is 50 MB." });
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