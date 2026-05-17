// apps/web/src/app/page.tsx
"use client";

import { AuthModal } from "@/components/auth/AuthModal";
import { useAuthModal } from "@/components/auth/useAuthModal";
import { useSession } from "@/hooks/auth/useSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const { isOpen, defaultTab, openLogin, openSignup, close } = useAuthModal();
  const router = useRouter();

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (!isPending && session) router.replace("/dashboard");
  }, [session, isPending, router]);

  return (
    <main className="flex flex-col items-center text-center px-6 pt-20 pb-12 max-w-2xl mx-auto">
      <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-slate-900 leading-[1.15] mb-4">
        Meeting notes, on autopilot
      </h1>
      <p className="text-[17px] text-slate-500 leading-relaxed mb-8 max-w-lg">
        Record or upload any meeting. MeetAI transcribes, summarises, and extracts action items instantly.
      </p>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={openSignup}
          className="px-7 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-[15px] hover:opacity-90 active:scale-[0.97] transition-all"
        >
          Get started free
        </button>
        <button
          onClick={openLogin}
          className="px-7 py-3 rounded-xl border-[1.5px] border-purple-200 text-violet-600 font-semibold text-[15px] hover:bg-purple-50 transition-all"
        >
          Sign in
        </button>
      </div>

      <AuthModal isOpen={isOpen} onClose={close} defaultTab={defaultTab} />
    </main>
  );
}