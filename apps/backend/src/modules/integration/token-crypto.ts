// packages/backend/src/modules/integration/token-crypto.ts
//
// AES-256-GCM symmetric encryption for OAuth tokens stored in MongoDB.
//
// Key source: TOKEN_ENCRYPTION_KEY env var — must be exactly 64 hex chars
// (= 32 bytes = 256 bits).
//
// Generate a key:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// Why AES-256-GCM?
//   • Authenticated encryption — any tampering of the ciphertext is detected
//     (via the auth tag) before decryption, so we never operate on corrupt data.
//   • A fresh 12-byte IV is generated per encryption call, so the same
//     plaintext never produces the same ciphertext twice.
//
// Wire format stored in DB (single string, colon-delimited):
//   "<iv_hex>:<authTag_hex>:<ciphertext_hex>"

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 12; // bytes — recommended for GCM

// ─────────────────────────────────────────────────────────────────────────────
// Key loading
// ─────────────────────────────────────────────────────────────────────────────

function loadKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;

  if (!hex) {
    throw new Error(
      "[token-crypto] TOKEN_ENCRYPTION_KEY is not set. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  if (hex.length !== 64) {
    throw new Error(
      `[token-crypto] TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got ${hex.length} chars.`,
    );
  }

  return Buffer.from(hex, "hex");
}

// Lazy-load so the error surfaces at call time (not module load time),
// which gives a cleaner startup error message.
let _key: Buffer | null = null;
function getKey(): Buffer {
  if (!_key) _key = loadKey();
  return _key;
}

// ─────────────────────────────────────────────────────────────────────────────
// encrypt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string and returns a storable "<iv>:<tag>:<ct>" string.
 * Returns null when plaintext is null (convenience for optional token fields).
 */
export function encrypt(plaintext: string):  string;
export function encrypt(plaintext: null):    null;
export function encrypt(plaintext: string | null): string | null {
  if (plaintext === null) return null;

  const key    = getKey();
  const iv     = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// decrypt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decrypts a "<iv>:<tag>:<ct>" string produced by encrypt().
 * Throws if the auth tag check fails (data was tampered with or key is wrong).
 * Returns null when stored is null.
 */
export function decrypt(stored: string):  string;
export function decrypt(stored: null):    null;
export function decrypt(stored: string | null): string | null {
  if (stored === null) return null;

  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("[token-crypto] Malformed ciphertext — expected iv:tag:ct");
  }

  const [ivHex, tagHex, ctHex] = parts;
  const key      = getKey();
  const iv       = Buffer.from(ivHex,  "hex");
  const authTag  = Buffer.from(tagHex, "hex");
  const ct       = Buffer.from(ctHex,  "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString("utf8");
}