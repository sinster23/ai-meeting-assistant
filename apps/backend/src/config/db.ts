// packages/backend/src/config/db.ts

import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

function getMongoUri(): string {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      "[db] MONGO_URI is not defined. Add it to your .env file."
    );
  }
  return uri;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDB(): Promise<void> {
  const uri = getMongoUri();

  mongoose.connection.on("connected", () =>
    console.log("[db] MongoDB connected")
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("[db] MongoDB disconnected")
  );
  mongoose.connection.on("error", (err) =>
    console.error("[db] MongoDB error:", err)
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      return; // success
    } catch (err) {
      console.error(`[db] Connection attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES) {
        console.log(`[db] Retrying in ${RETRY_DELAY_MS / 1000}s…`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new Error("[db] Could not connect to MongoDB after max retries.");
      }
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log("[db] MongoDB disconnected gracefully");
}