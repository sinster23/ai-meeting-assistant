"use client";

import { AuthModal } from "@/components/auth/AuthModal";
import { useAuthModal } from "@/components/auth/useAuthModal";
import { useSession } from "@/hooks/auth/useSession";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const { data: session, isPending } = useSession();
  const { isOpen, defaultTab, openLogin, openSignup, close } = useAuthModal();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isPending && session) router.replace("/dashboard");
  }, [session, isPending, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f9f8ff;
          color: #1a1830;
          overflow-x: hidden;
        }

        /* ── Navbar ── */
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 64px;
          background: rgba(249, 248, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: box-shadow 0.2s ease, background 0.2s ease;
        }
        .nav.scrolled {
          box-shadow: 0 1px 0 rgba(100, 80, 200, 0.1), 0 4px 16px rgba(83, 74, 183, 0.06);
          background: rgba(249, 248, 255, 0.95);
        }

        .nav-logo {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          color: #4338ca;
          letter-spacing: -0.02em;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6d5fef;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          list-style: none;
        }
        .nav-links a {
          font-size: 0.9rem;
          font-weight: 500;
          color: #4a4868;
          text-decoration: none;
          transition: color 0.15s;
        }
        .nav-links a:hover { color: #4338ca; }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-ghost {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: #4a4868;
          cursor: pointer;
          padding: 0.45rem 1rem;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .btn-ghost:hover { background: rgba(99, 80, 230, 0.07); color: #4338ca; }

        .btn-primary {
          background: #5b50e8;
          color: #fff;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.5rem 1.25rem;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.01em;
        }
        .btn-primary:hover { background: #4a40d4; }
        .btn-primary:active { transform: scale(0.97); }

        /* ── Hero ── */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 3rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 5rem 0rem 4rem;
          min-height: calc(100vh - 64px);
        }

        .hero-left { display: flex; flex-direction: column; gap: 1.5rem; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(91, 80, 232, 0.08);
          border: 1px solid rgba(91, 80, 232, 0.18);
          color: #4338ca;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 5px 12px;
          border-radius: 100px;
          width: fit-content;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6d5fef;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-headline {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.2rem, 4vw, 3.25rem);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: #1a1830;
        }
        .hero-headline span {
          color: #5b50e8;
        }

        .hero-sub {
          font-size: 1.05rem;
          color: #6b6886;
          line-height: 1.65;
          max-width: 440px;
        }

        .hero-ctas {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }

        .btn-cta-primary {
          background: #5b50e8;
          color: #fff;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.8rem 1.75rem;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 4px 18px rgba(91, 80, 232, 0.28);
        }
        .btn-cta-primary:hover {
          background: #4a40d4;
          box-shadow: 0 6px 24px rgba(91, 80, 232, 0.38);
          transform: translateY(-1px);
        }
        .btn-cta-primary:active { transform: scale(0.97); box-shadow: none; }

        .btn-cta-secondary {
          background: transparent;
          color: #5b50e8;
          border: 1.5px solid rgba(91, 80, 232, 0.3);
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.8rem 1.75rem;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .btn-cta-secondary:hover {
          background: rgba(91, 80, 232, 0.06);
          border-color: rgba(91, 80, 232, 0.5);
        }
        .btn-cta-secondary:active { transform: scale(0.97); }

        .hero-trust {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-top: 0.5rem;
        }
        .hero-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: #8b88a8;
          font-weight: 500;
        }
        .check-icon {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: rgba(29, 158, 117, 0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .check-icon svg { width: 9px; height: 9px; }

        /* ── Product Mockup ── */
        .hero-right {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          position: relative;
        }

        .mockup-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(91, 80, 232, 0.1);
          box-shadow:
            0 2px 4px rgba(0,0,0,0.04),
            0 12px 48px rgba(91, 80, 232, 0.1);
          width: 100%;
          max-width: 460px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        /* Mockup header bar */
        .mockup-header {
          background: #f4f3fc;
          border-bottom: 1px solid rgba(91,80,232,0.08);
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mockup-dots { display: flex; gap: 5px; }
        .mockup-dot {
          width: 8px; height: 8px; border-radius: 50%;
        }
        .mockup-dot:nth-child(1) { background: #ff6b6b; }
        .mockup-dot:nth-child(2) { background: #ffd43b; }
        .mockup-dot:nth-child(3) { background: #51cf66; }
        .mockup-title-bar {
          flex: 1;
          background: #eceaf8;
          border-radius: 6px;
          height: 22px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-size: 11px;
          color: #8b88a8;
          font-weight: 500;
        }
        .rec-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #f03e3e;
          margin-right: 6px;
          animation: pulse 1.5s infinite;
        }

        /* Meeting info row */
        .mockup-meeting-row {
          padding: 14px 18px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0eef8;
        }
        .meeting-name {
          font-size: 13px;
          font-weight: 600;
          color: #1a1830;
        }
        .meeting-time {
          font-size: 11px;
          color: #8b88a8;
          margin-top: 2px;
        }
        .badge-live {
          background: rgba(240, 62, 62, 0.08);
          color: #c92a2a;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.04em;
        }
        .badge-live-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #f03e3e;
          animation: pulse 1s infinite;
        }

        /* Transcript stream */
        .mockup-transcript {
          padding: 12px 18px;
          border-bottom: 1px solid #f0eef8;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .section-label {
          font-size: 10px;
          font-weight: 600;
          color: #a09ec0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .transcript-line {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .avatar {
          width: 22px; height: 22px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .av-purple { background: #ede9fe; color: #5b50e8; }
        .av-teal   { background: #d1fae5; color: #065f46; }
        .av-coral  { background: #fee2e2; color: #991b1b; }
        .transcript-bubble {
          background: #f7f6fe;
          border-radius: 0 8px 8px 8px;
          padding: 6px 10px;
          font-size: 11.5px;
          color: #3c3a5c;
          line-height: 1.5;
          flex: 1;
        }
        .transcript-time {
          font-size: 9px;
          color: #b0aec8;
          margin-top: 3px;
        }

        /* Summary panel */
        .mockup-summary {
          padding: 12px 18px;
          border-bottom: 1px solid #f0eef8;
        }
        .summary-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .toggle-track {
          width: 32px; height: 18px;
          background: #5b50e8;
          border-radius: 100px;
          position: relative;
        }
        .toggle-thumb {
          position: absolute;
          right: 2px; top: 2px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #fff;
        }
        .summary-points {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .summary-point {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 11px;
          color: #4a4868;
          line-height: 1.45;
        }
        .point-check {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: rgba(91, 80, 232, 0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .point-check svg { width: 8px; height: 8px; }

        /* Action items */
        .mockup-actions {
          padding: 12px 18px;
        }
        .action-item {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #f4f3fc;
        }
        .action-item:last-child { border-bottom: none; }
        .action-checkbox {
          width: 14px; height: 14px;
          border-radius: 4px;
          border: 1.5px solid #c4c2e0;
          flex-shrink: 0;
        }
        .action-checkbox.done {
          background: #5b50e8;
          border-color: #5b50e8;
          display: flex; align-items: center; justify-content: center;
        }
        .action-checkbox.done svg { width: 8px; height: 8px; }
        .action-text {
          font-size: 11px;
          color: #4a4868;
        }
        .action-assignee {
          margin-left: auto;
          font-size: 10px;
          color: #a09ec0;
          font-weight: 500;
        }

        /* floating accent cards */
        .accent-card {
          position: absolute;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(91,80,232,0.1);
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 500;
          color: #1a1830;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          animation: float 4s ease-in-out infinite;
        }
        .accent-card.left {
          left: -60px;
          bottom: 120px;
          animation-delay: 0.5s;
        }
        .accent-card.top-right {
          right: -48px;
          top: 60px;
          animation-delay: 1.2s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .accent-icon {
          width: 28px; height: 28px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }
        .accent-icon.purple { background: rgba(91,80,232,0.1); }
        .accent-icon.green  { background: rgba(29,158,117,0.1); }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .hero { grid-template-columns: 1fr; padding: 3rem 1.5rem; min-height: auto; gap: 3rem; }
          .hero-right { display: none; }
          .nav-links { display: none; }
          .nav { padding: 0 1.5rem; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <a href="#" className="nav-logo">
          <div className="nav-logo-dot" />
          MeetAI
        </a>

        <ul className="nav-links">
          <li><a href="#">Features</a></li>
          <li><a href="#">Pricing</a></li>
          <li><a href="#">About</a></li>
        </ul>

        <div className="nav-actions">
          <button className="btn-ghost" onClick={openLogin}>Login</button>
          <button className="btn-primary" onClick={openSignup}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        {/* Left */}
        <div className="hero-left">

          <h1 className="hero-headline">
            Your AI<br />
            <span>Meeting Workspace</span>
          </h1>

          <p className="hero-sub">
            Record meetings, generate transcripts, create summaries, and search conversations instantly — so you can stay present.
          </p>

          <div className="hero-ctas">
            <button className="btn-cta-primary" onClick={openSignup}>
              Start Recording
            </button>
            <button className="btn-cta-secondary" onClick={openLogin}>
              Sign in
            </button>
          </div>

          <div className="hero-trust">
            <div className="hero-trust-item">
              <div className="check-icon">
                <svg viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              For individuals &amp; teams
            </div>
            <div className="hero-trust-item">
              <div className="check-icon">
                <svg viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              No credit card required
            </div>
          </div>
        </div>

{/* Right — Real Photo */}
<div className="hero-right">

  <div style={{
    width: "100%",
    maxWidth: "560px",
    aspectRatio: "4 / 3",
    overflow: "hidden",
    position: "relative",
  }}>
    <img
      src="/img_notes_intro.png"
      alt="Meeting workspace"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  </div>
</div>
      </section>

      <AuthModal isOpen={isOpen} onClose={close} defaultTab={defaultTab} />
    </>
  );
}