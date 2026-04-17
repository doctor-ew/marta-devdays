"use client";

import { useState } from "react";
import { StadiumMap } from "@/components/StadiumMap";
import { NeighborhoodPicker } from "@/components/NeighborhoodPicker";
import { MatchSelector } from "@/components/MatchSelector";
import { RecommendationCard } from "@/components/RecommendationCard";
import { DelayBadge } from "@/components/DelayBadge";
import type { Match } from "@/lib/schemas";

type Zone = "Downtown" | "Midtown" | "Airport";

interface Props {
  matches: Match[];
  injectDelay: boolean;
}

export function HomeClient({ matches, injectDelay }: Props) {
  const [zone, setZone] = useState<Zone | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = zone !== null && selectedMatch !== null && !isLoading;

  async function getRecommendation() {
    if (!zone || !selectedMatch) return;

    setIsLoading(true);
    setIsStreaming(false);
    setRecommendation("");
    setError(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone, match: selectedMatch, injectDelay }),
      });

      if (!res.ok || !res.body) {
        setError("server_error");
        setIsLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let first = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (first) {
          setIsLoading(false);
          setIsStreaming(true);
          first = false;
        }
        setRecommendation((prev) => prev + chunk);
      }
    } catch {
      setError("network_error");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {injectDelay && <DelayBadge />}

      {/* Map — fills all remaining space */}
      <div className={["flex-1 relative", injectDelay ? "pt-9" : ""].join(" ")}>
        <StadiumMap />
      </div>

      {/* Sidebar */}
      <aside className="w-80 flex flex-col border-l border-border bg-surface overflow-hidden shrink-0">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">⚽</span>
            <h1 className="text-base font-bold text-text">Match Day ATL</h1>
          </div>
          <p className="text-xs text-muted mt-0.5">FIFA World Cup 2026 · Atlanta</p>
        </div>

        {/* Scrollable sidebar content */}
        <div className="flex-1 overflow-y-auto">
          {/* Schedule section */}
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              FIFA 2026 Schedule
            </h2>
            <MatchSelector
              matches={matches}
              selected={selectedMatch}
              onSelect={(m) => {
                setSelectedMatch(m);
                setRecommendation("");
                setError(null);
              }}
              disabled={false}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border mx-4 my-3" />

          {/* Zone picker */}
          <div className="px-4 pb-2">
            <NeighborhoodPicker selected={zone} onSelect={setZone} />
          </div>

          {/* CTA */}
          <div className="px-4 pb-4">
            <button
              onClick={getRecommendation}
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              className={[
                "w-full py-3 rounded-lg text-sm font-semibold transition-colors mt-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                canSubmit
                  ? "bg-accent hover:bg-accent-hover text-bg cursor-pointer"
                  : "bg-accent/35 text-bg cursor-not-allowed",
              ].join(" ")}
            >
              {isLoading ? "Routing..." : "How do I get there?"}
            </button>
          </div>

          {/* Recommendation */}
          {(recommendation || isLoading || error) && (
            <div className="px-4 pb-6">
              <div className="border-t border-border mb-4" />
              <RecommendationCard
                text={recommendation}
                isLoading={isLoading}
                isStreaming={isStreaming}
                error={error}
                onRetry={getRecommendation}
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
