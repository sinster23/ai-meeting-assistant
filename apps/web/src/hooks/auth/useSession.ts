// apps/web/src/hooks/auth/useSession.ts
"use client";

// Re-export better-auth's useSession so the rest of the app
// imports from a single consistent location: @/hooks/auth/useSession
export { useSession } from "@/lib/auth-client";