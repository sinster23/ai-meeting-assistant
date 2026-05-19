"use client";

export default function FeaturesSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .feat-section {
          font-family: 'DM Sans', sans-serif;
          background: #f9f8ff;
          padding: 5rem 2.5rem;
        }

        .feat-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .feat-header {
          text-align: center;
          margin-bottom: 5rem;
        }
        .feat-header h2 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 700;
          color: #1a1830;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 0.75rem;
        }
        .feat-header h2 span { color: #5b50e8; }
        .feat-header p {
          font-size: 1.05rem;
          color: #6b6886;
          line-height: 1.65;
          max-width: 480px;
          margin: 0 auto;
        }

        .feat-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
          margin-bottom: 6rem;
        }
        .feat-row:last-child { margin-bottom: 0; }
        .feat-row.reverse { direction: rtl; }
        .feat-row.reverse > * { direction: ltr; }

        .feat-text {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feat-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #5b50e8;
          background: rgba(91,80,232,0.08);
          border: 1px solid rgba(91,80,232,0.15);
          padding: 4px 12px;
          border-radius: 100px;
          width: fit-content;
        }

        .feat-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.4rem, 2.5vw, 1.9rem);
          font-weight: 700;
          color: #1a1830;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0;
        }
        .feat-title span { color: #5b50e8; }

        .feat-desc {
          font-size: 0.975rem;
          color: #6b6886;
          line-height: 1.7;
          margin: 0;
          max-width: 400px;
        }

        .feat-bullets {
          list-style: none;
          padding: 0;
          margin: 0.25rem 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .feat-bullets li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.9rem;
          color: #4a4868;
          line-height: 1.5;
        }
        .bullet-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(29,158,117,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .bullet-check svg { width: 10px; height: 10px; }

        .feat-img-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feat-blob {
          position: absolute;
          width: 88%;
          height: 88%;
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          background: rgba(91, 80, 232, 0.08);
          z-index: 0;
        }
        .feat-blob.alt {
          border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
        }

        .feat-img-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 520px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(91,80,232,0.1);
          box-shadow:
            0 8px 40px rgba(91,80,232,0.12),
            0 2px 8px rgba(0,0,0,0.04);
          background: #fff;
          aspect-ratio: 16 / 10;
        }

        .feat-img-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (max-width: 860px) {
          .feat-row,
          .feat-row.reverse {
            grid-template-columns: 1fr;
            direction: ltr;
            gap: 2rem;
          }
          .feat-section { padding: 3rem 1.5rem; }
          .feat-header { margin-bottom: 3rem; }
          .feat-row { margin-bottom: 4rem; }
        }
      `}</style>

      <section className="feat-section">
        <div className="feat-inner">

          {/* Header */}
          <div className="feat-header">
            <h2>Everything you need for<br /><span>smarter meetings</span></h2>
            <p>From live recording to AI-powered insights — every tool built to save you time and keep your team aligned.</p>
          </div>

          {/* ── Row 1: Recording ── */}
          <div className="feat-row">
            <div className="feat-text">
              <div className="feat-label">01 · Recording</div>
              <h3 className="feat-title">Meeting <span>Recording</span></h3>
              <p className="feat-desc">
                Capture every conversation seamlessly across all your favourite platforms — no setup, no friction.
              </p>
              <ul className="feat-bullets">
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Works with Zoom, Meet, Teams &amp; more
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Join with or without a bot
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  All recordings stored in one place
                </li>
              </ul>
            </div>
            <div className="feat-img-wrap">
              <div className="feat-blob" />
              <div className="feat-img-card">
                <img src="/images/feature-recording.png" alt="Meeting recording interface" />
              </div>
            </div>
          </div>

          {/* ── Row 2: Transcription (reversed) ── */}
          <div className="feat-row reverse">
            <div className="feat-text">
              <div className="feat-label">02 · Transcription</div>
              <h3 className="feat-title"><span>Transcription</span> in real-time</h3>
              <p className="feat-desc">
                Convert speech into accurate, searchable text with speaker identification — live as it happens.
              </p>
              <ul className="feat-bullets">
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Speaker-labelled transcripts
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Supports 30+ languages
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Synced playback with timestamps
                </li>
              </ul>
            </div>
            <div className="feat-img-wrap">
              <div className="feat-blob alt" />
              <div className="feat-img-card">
                <img src="/images/feature-transcription.png" alt="Live transcription interface" />
              </div>
            </div>
          </div>

          {/* ── Row 3: AI Summaries ── */}
          <div className="feat-row">
            <div className="feat-text">
              <div className="feat-label">03 · AI Summaries</div>
              <h3 className="feat-title">Instant <span>AI Summaries</span></h3>
              <p className="feat-desc">
                Get concise meeting recaps, key decisions, and next steps automatically — sent to your inbox the moment a call ends.
              </p>
              <ul className="feat-bullets">
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Summarize with AI in one click
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Key decisions &amp; topics highlighted
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Auto-shared with attendees
                </li>
              </ul>
            </div>
            <div className="feat-img-wrap">
              <div className="feat-blob" />
              <div className="feat-img-card">
                <img src="/images/feature-summaries.png" alt="AI summary interface" />
              </div>
            </div>
          </div>

          {/* ── Row 4: AI Search (reversed) ── */}
          <div className="feat-row reverse">
            <div className="feat-text">
              <div className="feat-label">04 · AI Search</div>
              <h3 className="feat-title"><span>AI Search</span> across meetings</h3>
              <p className="feat-desc">
                Ask questions in plain English and instantly surface answers from any past conversation.
              </p>
              <ul className="feat-bullets">
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Natural language queries
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Search across all your meetings
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Jump to the exact moment
                </li>
              </ul>
            </div>
            <div className="feat-img-wrap">
              <div className="feat-blob alt" />
              <div className="feat-img-card">
                <img src="/images/feature-search.png" alt="AI search interface" />
              </div>
            </div>
          </div>

          {/* ── Row 5: Action Items ── */}
          <div className="feat-row">
            <div className="feat-text">
              <div className="feat-label">05 · Action Items</div>
              <h3 className="feat-title">Extract <span>Action Items</span> automatically</h3>
              <p className="feat-desc">
                Never miss a follow-up. MeetAI identifies tasks, assigns owners, and tracks them to completion.
              </p>
              <ul className="feat-bullets">
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Auto-detected tasks &amp; owners
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Push to Jira, Asana, Linear
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Track progress across meetings
                </li>
              </ul>
            </div>
            <div className="feat-img-wrap">
              <div className="feat-blob" />
              <div className="feat-img-card">
                <img src="/images/feature-actions.png" alt="Action items interface" />
              </div>
            </div>
          </div>

          {/* ── Row 6: Calendar Integration (reversed) ── */}
          <div className="feat-row reverse">
            <div className="feat-text">
              <div className="feat-label">06 · Calendar</div>
              <h3 className="feat-title"><span>Calendar</span> Integration</h3>
              <p className="feat-desc">
                Connect your schedule so MeetAI knows exactly when to join, record, and deliver your recap — without lifting a finger.
              </p>
              <ul className="feat-bullets">
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Google Calendar &amp; Outlook sync
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Auto-joins scheduled meetings
                </li>
                <li>
                  <div className="bullet-check">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Recap delivered before your next call
                </li>
              </ul>
            </div>
            <div className="feat-img-wrap">
              <div className="feat-blob alt" />
              <div className="feat-img-card">
                <img src="/images/feature-calendar.png" alt="Calendar integration interface" />
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}