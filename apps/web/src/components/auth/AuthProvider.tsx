// apps/web/src/components/auth/AuthProvider.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/hooks/auth/useSession";

// Routes that don't need a session
const PUBLIC_PATHS = ["/", "/login", "/signup"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!session && !isPublic) {
      // Session expired or missing — bounce to home (modal opens there)
      router.replace("/");
    }
  }, [session, isPending, pathname, router]);

  return <>{children}</>;
}