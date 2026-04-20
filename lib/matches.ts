import { z } from 'zod';
import type { Match } from '@/types';

const MatchSchema = z.object({
  match_id: z.string(),
  team_a: z.string(),
  team_b: z.string(),
  kickoff_utc: z.string().datetime(),
  stage: z.string(),
  group: z.string().nullable(),
});

const MatchesSchema = z.array(MatchSchema).min(1);

let _matches: Match[] | null = null;

export function getMatches(): Match[] {
  if (_matches) return _matches;

  const raw: unknown = require('@/public/matches.json');
  const result = MatchesSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(
      `matches.json validation failed: ${result.error.message}`,
    );
  }

  _matches = result.data;
  return _matches;
}

export function getMatch(matchId: string): Match | undefined {
  return getMatches().find((m) => m.match_id === matchId);
}

export function minutesUntilKickoff(kickoff_utc: string): number {
  return Math.floor((new Date(kickoff_utc).getTime() - Date.now()) / 60_000);
}
