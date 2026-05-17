// apps/web/src/lib/auth-client.ts
// Mirrors the pattern of api.ts — single BASE_URL, credentials: "include" on all calls.

import { createAuthClient } from "better-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  fetchOptions: {
    // Send the session cookie on every request automatically
    credentials: "include",
  },
});

// Named exports so hooks can import just what they need
export const { signIn, signUp, signOut, useSession } = authClient;