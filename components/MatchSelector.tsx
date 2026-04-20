'use client';

import type { Match } from '@/types';

interface Props {
  matches: Match[];
  selected: string | null;
  onSelect: (matchId: string) => void;
}

function formatKickoff(kickoff_utc: string): string {
  return new Date(kickoff_utc).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MatchSelector({ matches, selected, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Select Match
      </h2>
      <ul className="flex flex-col gap-1" role="listbox" aria-label="FIFA matches">
        {matches.map((m) => {
          const isSelected = selected === m.match_id;
          return (
            <li key={m.match_id} role="option" aria-selected={isSelected}>
              <button
                type="button"
                onClick={() => onSelect(m.match_id)}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  isSelected
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700',
                ].join(' ')}
              >
                <div className="font-medium">
                  {m.team_a === 'TBD'
                    ? m.stage
                    : `${m.team_a} vs ${m.team_b}`}
                </div>
                <div className="text-xs text-gray-400">
                  {m.stage}
                  {m.group != null ? ` · Group ${m.group}` : ''} ·{' '}
                  {formatKickoff(m.kickoff_utc)} ET
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
