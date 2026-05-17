// apps/web/src/hooks/auth/useLogin.ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import type { LoginRequest } from "@repo/types";

interface UseLoginReturn {
  login: (form: LoginRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLogin(): UseLoginReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async ({ email, password }: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.email({
        email,
        password,
        fetchOptions: { credentials: "include" },
      });

      if (result.error) {
        setError(result.error.message ?? "Invalid email or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh(); // force server components to re-read the new cookie
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error, clearError: () => setError(null) };
}