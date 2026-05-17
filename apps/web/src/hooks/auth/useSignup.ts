// apps/web/src/hooks/auth/useSignup.ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import type { SignupRequest } from "@repo/types";

interface UseSignupReturn {
  signup: (form: SignupRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSignup(): UseSignupReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async ({ name, email, password }: SignupRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        fetchOptions: { credentials: "include" },
      });

      if (result.error) {
        setError(result.error.message ?? "Could not create account.");
        return;
      }

      // better-auth auto-signs-in after signup — go straight to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading, error, clearError: () => setError(null) };
}