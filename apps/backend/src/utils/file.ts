// packages/backend/src/utils/file.ts

import fs from "fs/promises";
import path from "path";

// All uploaded audio lands here — outside the src tree
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

/** Ensure the uploads directory exists on startup */
export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Writes a buffer to disk under the controlled upload directory.
 * Returns the absolute path of the saved file.
 */
export async function saveFile(
  fileName: string,
  buffer: Buffer
): Promise<string> {
  // Sanitise: strip any path separators from the filename
  const safeName = path.basename(fileName);
  const filePath = path.join(UPLOAD_DIR, safeName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}