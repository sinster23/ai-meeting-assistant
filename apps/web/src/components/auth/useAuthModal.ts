"use client";

import { useState, useCallback } from "react";

type Tab = "login" | "signup";

interface UseAuthModalReturn {
  isOpen: boolean;
  defaultTab: Tab;
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;
}

export function useAuthModal(): UseAuthModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<Tab>("login");

  const openLogin = useCallback(() => {
    setDefaultTab("login");
    setIsOpen(true);
  }, []);

  const openSignup = useCallback(() => {
    setDefaultTab("signup");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, defaultTab, openLogin, openSignup, close };
}