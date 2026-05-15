// packages/backend/src/main.ts
// Entry point — wires infra (DB, uploads dir) then starts HTTP server

import "dotenv/config";
import app from "./server";
import { connectDB, disconnectDB } from "./config/db";
import { ensureUploadDir } from "./utils/file";

const PORT = process.env.PORT ?? 4000;

async function bootstrap() {
  // 1. Ensure uploads directory exists
  await ensureUploadDir();

  // 2. Connect to MongoDB (with retry)
  await connectDB();

  // 3. Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────
  async function shutdown(signal: string) {
    console.log(`\n[server] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      console.log("[server] Shutdown complete");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});