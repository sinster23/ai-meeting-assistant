"use client";

export default function HowItWorksSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .hiw-section {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #e4f7f2 0%, #edfaf6 50%, #f2faf7 100%);
          padding: 5rem 2.5rem;
          text-align: center;
        }
        .hiw-inner { max-width: 1100px; margin: 0 auto; }

        .hiw-eyebrow {
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #5b50e8;
          margin-bottom: 1rem;
        }
        .hiw-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 700;
          color: #1a1830;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 0.75rem;
        }
        .hiw-title span { color: #5b50e8; }
        .hiw-sub {
          font-size: 1rem;
          color: #6b6886;
          line-height: 1.65;
          max-width: 480px;
          margin: 0 auto 4rem;
        }

        .hiw-flow {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
        }

        .hiw-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hiw-connector {
          flex: 0 0 56px;
          display: flex;
          align-items: flex-start;
          padding-top: 34px;
        }
        .hiw-connector svg { width: 56px; height: 20px; }

        .step-num {
          font-family: 'Sora', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a09ec0;
          margin-bottom: 0.75rem;
        }

        .step-icon-wrap {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          position: relative;
        }

        .step-icon-wrap svg {
          width: 30px;
          height: 30px;
          stroke: #000000;
          stroke-width: 1.6;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .step-badge {
          position: absolute;
          top: -9px;
          right: -9px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #5b50e8;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          border: 2px solid #f9f8ff;
        }

        .step-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #1a1830;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }
        .step-desc {
          font-size: 0.875rem;
          color: #6b6886;
          line-height: 1.6;
          max-width: 185px;
          margin: 0 auto;
        }
        .step-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-top: 0.75rem;
        }
        .step-pill {
          font-size: 0.72rem;
          font-weight: 500;
          background: rgba(91, 80, 232, 0.08);
          color: #4338ca;
          border: 1px solid rgba(91, 80, 232, 0.15);
          padding: 3px 10px;
          border-radius: 100px;
        }

        .hiw-bottom {
          margin-top: 4.5rem;
          padding-top: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }
        .hiw-stat { text-align: center; }
        .hiw-stat-num {
          font-family: 'Sora', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #5b50e8;
          letter-spacing: -0.03em;
        }
        .hiw-stat-label { font-size: 0.82rem; color: #8b88a8; margin-top: 2px; }
        .hiw-stat-divider { width: 1px; height: 40px;}

        @media (max-width: 780px) {
          .hiw-flow { flex-direction: column; align-items: center; gap: 2.5rem; }
          .hiw-connector { display: none; }
          .step-desc { max-width: 260px; }
          .hiw-section { padding: 3rem 1.5rem; }
          .hiw-sub { margin-bottom: 2.5rem; }
        }
      `}</style>

      <section className="hiw-section">
        <div className="hiw-inner">

          <div className="hiw-eyebrow">How it works</div>
          <h2 className="hiw-title">
            From conversation to<br />
            <span>clarity in 4 steps</span>
          </h2>
          <p className="hiw-sub">
            MeetAI runs quietly in the background — so you can focus on the meeting, not on taking notes.
          </p>

          <div className="hiw-flow">

            {/* ── Step 1: Record ── */}
            <div className="hiw-step">
              <div className="step-icon-wrap">
                {/* Microphone icon */}
                <svg viewBox="0 0 24 24">
                  <rect x="9" y="2" width="6" height="11" rx="3"/>
                  <path d="M5 10a7 7 0 0 0 14 0"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                </svg>
              </div>
              <div className="step-title">Record</div>
              <p className="step-desc">Join any meeting and MeetAI captures audio instantly — no bots, no interruptions.</p>
            </div>

            {/* Connector */}
            <div className="hiw-connector">
              <svg viewBox="0 0 56 20" fill="none">
                <line x1="0" y1="10" x2="44" y2="10" stroke="#c4c2e0" strokeWidth="1.5" strokeDasharray="4 3"/>
                <path d="M42 6L50 10L42 14" stroke="#c4c2e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* ── Step 2: Transcribe ── */}
            <div className="hiw-step">
              <div className="step-icon-wrap">
                {/* File text / transcript icon */}
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <line x1="10" y1="9" x2="8" y2="9"/>
                </svg>
              </div>
              <div className="step-title">Transcribe</div>
              <p className="step-desc">Speech is converted into accurate, speaker-labelled text in real time as the meeting unfolds.</p>
            </div>

            {/* Connector */}
            <div className="hiw-connector">
              <svg viewBox="0 0 56 20" fill="none">
                <line x1="0" y1="10" x2="44" y2="10" stroke="#c4c2e0" strokeWidth="1.5" strokeDasharray="4 3"/>
                <path d="M42 6L50 10L42 14" stroke="#c4c2e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* ── Step 3: Summarize ── */}
            <div className="hiw-step">
              <div className="step-icon-wrap">
                {/* Sparkles / AI icon */}
                <svg viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
              </div>
              <div className="step-title">Summarize</div>
              <p className="step-desc">AI generates a concise recap with key decisions, highlights, and action items the moment the call ends.</p>
            </div>

            {/* Connector */}
            <div className="hiw-connector">
              <svg viewBox="0 0 56 20" fill="none">
                <line x1="0" y1="10" x2="44" y2="10" stroke="#c4c2e0" strokeWidth="1.5" strokeDasharray="4 3"/>
                <path d="M42 6L50 10L42 14" stroke="#c4c2e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* ── Step 4: Search ── */}
            <div className="hiw-step">
              <div className="step-icon-wrap">
                {/* Search icon */}
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div className="step-title">Search</div>
              <p className="step-desc">Ask anything in plain English and instantly surface answers from any past conversation.</p>
            </div>

          </div>

          {/* Bottom stats */}
          <div className="hiw-bottom">
            <div className="hiw-stat">
              <div className="hiw-stat-num">2 min</div>
              <div className="hiw-stat-label">Avg. setup time</div>
            </div>
            <div className="hiw-stat-divider" />
            <div className="hiw-stat">
              <div className="hiw-stat-num">99%</div>
              <div className="hiw-stat-label">Transcription accuracy</div>
            </div>
            <div className="hiw-stat-divider" />
            <div className="hiw-stat">
              <div className="hiw-stat-num">30+</div>
              <div className="hiw-stat-label">Languages supported</div>
            </div>
            <div className="hiw-stat-divider" />
            <div className="hiw-stat">
              <div className="hiw-stat-num">10×</div>
              <div className="hiw-stat-label">Faster meeting follow-up</div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}