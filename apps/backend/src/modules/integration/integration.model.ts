// packages/backend/src/modules/integration/integration.model.ts
//
// Two models:
//   IntegrationToken  — one doc per (userId, provider), holds AES-256-GCM
//                       encrypted OAuth tokens.  Fields with select:false so
//                       they are NEVER returned by accident in a plain .find().
//   UserIntegration   — one doc per userId, holds connection flags + automation
//                       prefs.  Intentionally separate from IntegrationToken so
//                       "is Google connected?" is a single lightweight query
//                       that never touches sensitive token data.

import mongoose, { Schema, Document } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PROVIDERS = [
  "google",
  "slack",
  "zoom",
  "email",
  "notion",
] as const;

export type Provider = (typeof PROVIDERS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// IntegrationToken
// ─────────────────────────────────────────────────────────────────────────────
// • accessToken and refreshToken are stored AES-256-GCM encrypted.
//   The crypto helpers live in token-crypto.ts.
// • Both fields carry `select: false` — they will NOT appear in any query
//   result unless the caller explicitly does .select("+accessToken +refreshToken").
//   This prevents accidental token leakage in logs, API responses, etc.

export interface IIntegrationToken extends Document {
  userId:       string;
  provider:     Provider;
  accessToken:  string;        // stored encrypted
  refreshToken: string | null; // stored encrypted, null when not granted
  expiresAt:    Date | null;
  scope:        string | null;
  createdAt:    Date;
  updatedAt:    Date;
}

const IntegrationTokenSchema = new Schema<IIntegrationToken>(
  {
    userId: {
      type:     String,
      required: true,
      index:    true,
    },
    provider: {
      type:     String,
      enum:     PROVIDERS,
      required: true,
    },
    // ── Sensitive fields — select:false prevents accidental exposure ──────────
    accessToken: {
      type:     String,
      required: true,
      select:   false, // ← never returned unless explicitly requested
    },
    refreshToken: {
      type:   String,
      default: null,
      select:  false, // ← never returned unless explicitly requested
    },
    expiresAt: { type: Date,   default: null },
    scope:     { type: String, default: null },
  },
  { timestamps: true },
);

// One token doc per user+provider combination
IntegrationTokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const IntegrationTokenModel =
  (mongoose.models.IntegrationToken as mongoose.Model<IIntegrationToken>) ||
  mongoose.model<IIntegrationToken>("IntegrationToken", IntegrationTokenSchema);

// ─────────────────────────────────────────────────────────────────────────────
// UserIntegration
// ─────────────────────────────────────────────────────────────────────────────

export interface IAutomationSettings {
  autoSummarize:      boolean;
  autoEmailSummary:   boolean;
  autoImportCalendar: boolean;
  autoStartRecording: boolean;
}

export interface IConnectedProvider {
  provider:    Provider;
  connectedAt: Date;
}

export interface IUserIntegration extends Document {
  userId:     string;
  connected:  IConnectedProvider[];
  automation: IAutomationSettings;
  createdAt:  Date;
  updatedAt:  Date;
}

const ConnectedProviderSchema = new Schema<IConnectedProvider>(
  {
    provider:    { type: String, enum: PROVIDERS, required: true },
    connectedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const AutomationSettingsSchema = new Schema<IAutomationSettings>(
  {
    autoSummarize:      { type: Boolean, default: true  },
    autoEmailSummary:   { type: Boolean, default: false },
    autoImportCalendar: { type: Boolean, default: true  },
    autoStartRecording: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserIntegrationSchema = new Schema<IUserIntegration>(
  {
    userId:     { type: String, required: true, unique: true, index: true },
    connected:  { type: [ConnectedProviderSchema], default: [] },
    automation: { type: AutomationSettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const UserIntegrationModel =
  (mongoose.models.UserIntegration as mongoose.Model<IUserIntegration>) ||
  mongoose.model<IUserIntegration>("UserIntegration", UserIntegrationSchema);