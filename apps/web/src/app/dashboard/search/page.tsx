// apps/web/app/search/page.tsx
"use client";

import { useState } from "react";
import { useSearch } from "@/hooks/search/useSearch";
import { SearchInput } from "@/components/search/SearchInput";
import {
  SearchResults,
  SearchResultsSkeleton,
  SearchError,
} from "@/components/search/SearchResults";

const glowKeyframes = `
  @keyframes borderGlow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const purple = {
  50:  "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  800: "#3C3489",
  900: "#26215C",
};

export default function SearchPage() {
  const search = useSearch();
  const [submittedQuery, setSubmittedQuery] = useState("");

  function handleSearch(query: string) {
    setSubmittedQuery(query);
    search.mutate({ query });
  }

  const showSkeleton = search.isPending;
  const showError    = search.isError && !search.isPending;
  const showResults  = search.isSuccess && !search.isPending;
  const showEmpty    = !search.isPending && !search.isError && !search.isSuccess;

  return (
    <>
      <style>{glowKeyframes}</style>

      <div style={{
        minHeight: "100vh",
        background: "#f5f4fb",
        fontFamily: font,
        display: "flex",
        justifyContent: "center",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "890px",
          padding: "40px 14px 80px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: "32px", textAlign: "center", width: "100%" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "6px",
            }}>
              <h1 style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111111",
                letterSpacing: "-0.03em",
                margin: 0,
                fontFamily: font,
              }}>
                Search
              </h1>

              {/* ── Glowing border badge — original bg & text colors ── */}
              <div style={{
                display: "inline-flex",
                padding: "1.5px",
                borderRadius: "22px",
                background: "linear-gradient(270deg, #c084fc, #818cf8, #38bdf8, #c084fc)",
                backgroundSize: "300% 300%",
                animation: "borderGlow 3s ease infinite",
              }}>
                <div style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#555555",
                  background: "#f0f0f0",
                  padding: "2px 9px",
                  borderRadius: "20px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase" as const,
                }}>
                  AI-powered
                </div>
              </div>
            </div>

            <p style={{
              fontSize: "14px",
              color: "#999999",
              margin: 0,
              fontFamily: font,
            }}>
              Ask anything about your meetings — decisions, action items, and more.
            </p>
          </div>

          {/* ── Input + suggestions (full width) ── */}
          <div style={{ width: "100%" }}>
            <SearchInput onSearch={handleSearch} isLoading={search.isPending} />
          </div>

          {/* ── Divider ── */}
          {(showSkeleton || showError || showResults) && (
            <div style={{
              width: "100%",
              height: "1px",
              background: purple[50],
              marginBottom: "24px",
            }} />
          )}

          {/* ── Results area ── */}
          <div style={{ width: "100%" }}>
            {showSkeleton && <SearchResultsSkeleton />}

            {showError && (
              <SearchError
                message={search.error?.message ?? "Something went wrong. Please try again."}
              />
            )}

            {showResults && search.data && (
              <SearchResults result={search.data} query={submittedQuery} />
            )}

            {showEmpty && <EmptyState />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Idle / empty state ────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 0 24px",
      textAlign: "center",
    }}>
      <div style={{
        width: "52px",
        height: "52px",
        borderRadius: "16px",
        background: purple[50],
        border: `1px solid ${purple[100]}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "16px",
      }}>
        <svg
          width="22" height="22" viewBox="0 0 24 24"
          fill="none" stroke={purple[400]}
          strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <p style={{
        fontSize: "15px",
        fontWeight: "600",
        color: "#333333",
        fontFamily: font,
        margin: "0 0 6px",
      }}>
        Ask your meetings anything
      </p>
      <p style={{
        fontSize: "13px",
        color: purple[200],
        fontFamily: font,
        margin: 0,
        maxWidth: "320px",
        lineHeight: 1.55,
      }}>
        Search across all your transcripts using natural language.
        Results are grounded in what was actually said.
      </p>
    </div>
  );
}