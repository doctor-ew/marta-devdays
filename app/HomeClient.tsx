'use client';

import { useSearchParams } from 'next/navigation';
import { getMatches } from '@/lib/matches';
import MapViewClient from '@/components/MapViewClient';
import Sidebar from '@/components/Sidebar';
import DelayBanner from '@/components/DelayBanner';
import type { DelayState } from '@/types';

export default function HomeClient() {
  const searchParams = useSearchParams();
  const delayState: DelayState =
    searchParams.get('inject_delay') === 'blue_line' ? 'blue_line_delay' : 'normal';
  const matches = getMatches();

  return (
    <main className="relative h-full w-full">
      {delayState === 'blue_line_delay' && <DelayBanner />}
      <MapViewClient />
      <Sidebar matches={matches} delayState={delayState} />
    </main>
  );
}
