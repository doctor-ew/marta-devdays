"use client";

import type { Match } from "@/lib/schemas";

interface Props {
  matches: Match[];
  selected: Match | null;
  onSelect: (match: Match) => void;
  disabled?: boolean;
}

function formatKickoff(utc: string): string {
  return new Date(utc).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function matchTitle(match: Match): string {
  if (match.team_a === "TBD" && match.team_b === "TBD") return match.stage;
  return `${match.team_a} vs. ${match.team_b}`;
}

function matchSubtitle(match: Match): string {
  if (match.group) return `Group ${match.group} · Mercedes-Benz Stadium`;
  return `${match.stage} · Mercedes-Benz Stadium`;
}

export function MatchSelector({ matches, selected, onSelect, disabled }: Props) {
  return (
    <div
      role="listbox"
      aria-label="Select match"
      className={["flex flex-col gap-2", disabled ? "opacity-40 pointer-events-none" : ""].join(" ")}
      aria-disabled={disabled}
    >
      {matches.map((match) => {
        const isSelected = selected?.match_id === match.match_id;
        return (
          <button
            key={match.match_id}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(match)}
            className={[
              "flex flex-col items-start w-full px-3 py-3 rounded-lg border text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isSelected
                ? "border-l-4 border-accent bg-bg"
                : "border-border bg-bg hover:bg-border/20",
            ].join(" ")}
          >
            <span className="text-sm font-semibold text-text leading-snug">
              {matchTitle(match)}
            </span>
            <span className="text-xs text-muted mt-1 leading-snug">
              {matchSubtitle(match)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted mt-1.5">
              <span aria-hidden="true">📅</span>
              {formatKickoff(match.kickoff_utc)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
