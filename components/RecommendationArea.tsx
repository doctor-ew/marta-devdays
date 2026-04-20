'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Zone, DelayState } from '@/types';
import { getFallback } from '@/lib/fallbacks';

const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_DEMO === 'true';

interface Props {
  zone: Zone;
  matchId: string;
  delayState: DelayState;
  trigger: number; // increment from parent to fire a new request
}

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export default function RecommendationArea({ zone, matchId, delayState, trigger }: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async () => {
    if (IS_STATIC) {
      setText(getFallback(zone, delayState));
      setStatus('done');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setStatus('loading');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone, match_id: matchId, delay_state: delayState }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setStatus('error');
        return;
      }

      setStatus('streaming');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((prev) => prev + decoder.decode(value, { stream: true }));
      }

      setStatus('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStatus('error');
    }
  }, [zone, matchId, delayState]);

  useEffect(() => {
    if (trigger === 0) return;
    doFetch();
    return () => abortRef.current?.abort();
  }, [trigger, doFetch]);

  if (status === 'idle') return null;

  return (
    <div className="rounded-lg bg-gray-800 p-3 text-sm">
      {status === 'loading' && (
        <div className="flex flex-col gap-2" aria-label="Loading recommendation">
          <div className="h-3 w-full animate-pulse rounded bg-gray-700" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-gray-700" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-gray-700" />
        </div>
      )}

      {(status === 'streaming' || status === 'done') && (
        <p className="leading-relaxed text-gray-100">
          {text}
          {status === 'streaming' && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-green-400" aria-hidden />
          )}
        </p>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-red-400">Something went wrong.</span>
          <button
            type="button"
            onClick={doFetch}
            className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-600"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
