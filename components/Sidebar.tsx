'use client';

import { useState } from 'react';
import type { Match, Zone, DelayState } from '@/types';
import MatchSelector from './MatchSelector';
import ZonePicker from './ZonePicker';
import RecommendationArea from './RecommendationArea';

interface Props {
  matches: Match[];
  delayState: DelayState;
}

export default function Sidebar({ matches, delayState }: Props) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [trigger, setTrigger] = useState(0);

  const canSubmit = selectedMatch !== null && selectedZone !== null;

  return (
    <aside className="fixed right-0 top-0 z-10 flex h-full w-80 flex-col gap-4 overflow-y-auto bg-gray-900 p-4 shadow-xl">
      <div>
        <h1 className="text-lg font-bold text-white">Match Day ATL</h1>
        <p className="text-xs text-gray-400">FIFA World Cup 2026 · Mercedes-Benz Stadium</p>
      </div>

      <MatchSelector
        matches={matches}
        selected={selectedMatch}
        onSelect={setSelectedMatch}
      />

      <ZonePicker
        selected={selectedZone}
        onSelect={setSelectedZone}
      />

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => setTrigger((n) => n + 1)}
        className={[
          'rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
          canSubmit
            ? 'bg-green-600 text-white hover:bg-green-500 active:bg-green-700'
            : 'cursor-not-allowed bg-gray-700 text-gray-500',
        ].join(' ')}
      >
        How do I get there?
      </button>

      {canSubmit && (
        <RecommendationArea
          zone={selectedZone!}
          matchId={selectedMatch!}
          delayState={delayState}
          trigger={trigger}
        />
      )}
    </aside>
  );
}
