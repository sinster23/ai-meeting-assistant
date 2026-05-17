// apps/web/src/components/auth/AuthModal.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLogin } from "@/hooks/auth/useLogin";
import { useSignup } from "@/hooks/auth/useSignup";
import type { LoginRequest, SignupRequest } from "@repo/types";

type Tab = "login" | "signup";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

// ── Google SVG ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Logo mark ─────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );
}

// ── Input field ───────────────────────────────────────────────────────────

function Field({
  label, type, value, onChange, autoComplete, disabled,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "13.5px", fontWeight: 500, color: "#374151" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 13px",
          border: `1.5px solid ${focused ? "#6366F1" : "#D1D5DB"}`,
          borderRadius: "8px",
          fontSize: "14px",
          color: "#111827",
          background: disabled ? "#F9FAFB" : "#FFFFFF",
          outline: "none",
          boxSizing: "border-box",
          boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.14)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────

function PrimaryBtn({ children, loading, disabled }: {
  children: React.ReactNode; loading?: boolean; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "12px",
        background: hovered && !disabled
          ? "linear-gradient(135deg, #4F46E5 0%, #5B5BD6 100%)"
          : "linear-gradient(135deg, #5B5BD6 0%, #6366F1 100%)",
        color: "#fff", border: "none", borderRadius: "8px",
        fontSize: "15px", fontWeight: 600,
        fontFamily: "inherit",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        transition: "background 0.15s, transform 0.1s",
        transform: hovered && !disabled && !loading ? "translateY(-1px)" : "none",
        boxShadow: hovered && !disabled ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
        letterSpacing: "-0.01em",
      }}
    >
      {loading && (
        <span style={{
          width: 15, height: 15,
          border: "2px solid rgba(255,255,255,0.35)",
          borderTopColor: "#fff",
          borderRadius: "50%",
          display: "inline-block",
          animation: "meetai-spin 0.65s linear infinite",
        }} />
      )}
      {children}
    </button>
  );
}

// ── Google button ─────────────────────────────────────────────────────────

function GoogleBtn() {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "11px",
        background: hovered ? "#F9FAFB" : "#FFFFFF",
        border: "1.5px solid #D1D5DB", borderRadius: "8px",
        fontSize: "14px", fontWeight: 500,
        fontFamily: "inherit",
        color: "#374151",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
        transition: "background 0.15s",
      }}
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <p role="alert" style={{
      margin: 0, fontSize: "13px", color: "#DC2626",
      background: "#FEF2F2", border: "1px solid #FECACA",
      borderRadius: "8px", padding: "9px 13px", fontFamily: "inherit",
    }}>{msg}</p>
  );
}

// ── Login form ────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError } = useLogin();

  return (
    <form
      onSubmit={async e => { e.preventDefault(); clearError(); await login({ email, password } satisfies LoginRequest); }}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" disabled={isLoading} />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" disabled={isLoading} />
      {error && <ErrorBanner msg={error} />}
      <PrimaryBtn loading={isLoading} disabled={isLoading}>
        {isLoading ? "Logging in…" : "Log in"}
      </PrimaryBtn>
      <GoogleBtn />
    </form>
  );
}

// ── Signup form ───────────────────────────────────────────────────────────

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, isLoading, error, clearError } = useSignup();

  return (
    <form
      onSubmit={async e => { e.preventDefault(); clearError(); await signup({ name, email, password } satisfies SignupRequest); }}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <Field label="Name" type="text" value={name} onChange={setName} autoComplete="name" disabled={isLoading} />
      <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" disabled={isLoading} />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" disabled={isLoading} />
      {error && <ErrorBanner msg={error} />}
      <PrimaryBtn loading={isLoading} disabled={isLoading}>
        {isLoading ? "Creating account…" : "Create account"}
      </PrimaryBtn>
      <GoogleBtn />
    </form>
  );
}

// ── AuthModal ─────────────────────────────────────────────────────────────

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen) setTab(defaultTab); }, [isOpen, defaultTab]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const onOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const isLogin = tab === "login";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        @keyframes meetai-spin   { to { transform: rotate(360deg); } }
        @keyframes meetai-fade   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes meetai-rise   {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={onOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label={isLogin ? "Log in" : "Create account"}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
          background: "rgba(17,24,39,0.48)",
          backdropFilter: "blur(5px)",
          animation: "meetai-fade 0.18s ease",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* Modal card */}
        <div style={{
          width: "100%", maxWidth: "460px",
          background: "#F3F4F6",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)",
          animation: "meetai-rise 0.24s cubic-bezier(0.34,1.4,0.64,1)",
        }}>

          {/* ── Header area (grey bg, centered) ── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: "40px", paddingBottom: "28px",
            paddingLeft: "40px", paddingRight: "40px",
            position: "relative",
          }}>
            {/* Close X */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute", top: "16px", right: "16px",
                width: "30px", height: "30px",
                background: "#E5E7EB", border: "none", borderRadius: "7px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#6B7280",
                transition: "background 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Logo */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "22px",
            }}>
              <div style={{
                width: "36px", height: "36px",
                background: "linear-gradient(135deg, #5B5BD6, #818CF8)",
                borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <LogoMark />
              </div>
              <span style={{
                fontSize: "18px", fontWeight: 700, color: "#111827",
                letterSpacing: "-0.03em",
              }}>
                Meet<span style={{ color: "#6366F1" }}>AI</span>
              </span>
            </div>

            {/* Heading */}
            <h1 style={{
              fontSize: "22px", fontWeight: 700, color: "#111827",
              letterSpacing: "-0.03em", margin: "0 0 7px",
              textAlign: "center",
            }}>
              {isLogin ? "Log in to your account" : "Create an account"}
            </h1>

            {/* Toggle link */}
            <p style={{ fontSize: "13.5px", color: "#6B7280", margin: 0, textAlign: "center" }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setTab(isLogin ? "signup" : "login")}
                style={{
                  background: "none", border: "none", padding: 0, margin: 0,
                  color: "#6366F1", fontWeight: 600, fontSize: "13.5px",
                  fontFamily: "inherit", cursor: "pointer",
                }}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>

          {/* ── White form card ── */}
          <div style={{
            margin: "0 16px 16px",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            padding: "26px 26px 28px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            {isLogin
              ? <LoginForm onSwitch={() => setTab("signup")} />
              : <SignupForm onSwitch={() => setTab("login")} />}
          </div>

          {/* ── Footer ── */}
          <p style={{
            textAlign: "center", fontSize: "11.5px",
            color: "#9CA3AF", padding: "0 16px 20px", margin: 0,
          }}>
            By continuing you agree to our{" "}
            <a href="/terms" style={{ color: "#6366F1", textDecoration: "none", fontWeight: 500 }}>Terms</a>
            {" "}&amp;{" "}
            <a href="/privacy" style={{ color: "#6366F1", textDecoration: "none", fontWeight: 500 }}>Privacy</a>
          </p>
        </div>
      </div>
    </>
  );
}