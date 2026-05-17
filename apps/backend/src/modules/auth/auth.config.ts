// packages/backend/src/modules/auth/auth.config.ts
//
// Better Auth configuration.
// Docs: https://www.better-auth.com/docs
//
// Install:
//   bun add better-auth

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// ── MongoDB client (separate from Mongoose — Better Auth needs the raw driver) ──

const mongoClient = new MongoClient(
  process.env.MONGO_URI !
);

const db = mongoClient.db();

// ── Auth instance ─────────────────────────────────────────────────────────

export const auth = betterAuth({
  database: mongodbAdapter(db),

  // ── Session config ──────────────────────────────────────────────────────
  session: {
    expiresIn:        60 * 60 * 24 * 7,  // 7 days
    updateAge:        60 * 60 * 24,       // refresh session if older than 1 day
    cookieCache: {
      enabled:    true,
      maxAge:     60 * 5, // 5-minute client-side cache
    },
  },

  // ── Cookie security ─────────────────────────────────────────────────────
  advanced: {
    cookiePrefix:  "meetai",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  // ── Trusted origins (CORS) ──────────────────────────────────────────────
  trustedOrigins: [
    process.env.FRONTEND_URL ?? "http://localhost:3000",
  ],

  // ── Email + password ────────────────────────────────────────────────────
  emailAndPassword: {
    enabled:          true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Email verification is optional for now — enable when you add a mailer
    requireEmailVerification: false,
  },

  // ── User model extras ───────────────────────────────────────────────────
  // These fields are added to the Better Auth `user` collection.
  user: {
    additionalFields: {
      displayName: {
        type:     "string",
        required: false,
        defaultValue: null,
      },
    },
  },

  // ── Future: Google OAuth ────────────────────────────────────────────────
  // Uncomment and add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to .env
  //
  // socialProviders: {
  //   google: {
  //     clientId:     process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //     // Request Calendar + Gmail scopes when you need them:
  //     // scope: ["openid", "email", "profile",
  //     //         "https://www.googleapis.com/auth/calendar.readonly",
  //     //         "https://www.googleapis.com/auth/gmail.readonly"],
  //   },
  // },
});

// Export the inferred Session / User types for use in middleware + routes
export type Session = typeof auth.$Infer.Session;
export type User    = typeof auth.$Infer.Session.user;