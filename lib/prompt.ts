import type { Zone, DelayState } from '@/types';
import type { Match } from '@/types';

const ZONE_DESCRIPTIONS: Record<Zone, string> = {
  downtown: 'Five Points / Centennial Park area (Blue/Green Line access)',
  midtown: 'Arts Center / Peachtree St area (Red/Gold Line)',
  airport: 'Hartsfield-Jackson Airport / College Park MARTA station (Red/Gold Line)',
  decatur: 'Decatur MARTA station (Blue Line, east of Five Points)',
  dunwoody: 'Dunwoody MARTA station (Red Line, north Atlanta)',
};

const DELAY_CONTEXT: Record<DelayState, string> = {
  normal: 'MARTA status: All lines running normally.',
  blue_line_delay:
    'MARTA status: Blue Line — Moderate congestion, 20+ min delays at Vine City / SEC District. Fans taking the Blue Line to the stadium will experience significant delays.',
};

export function buildSystemPrompt(): string {
  return [
    'You are a local Atlanta friend who knows MARTA very well.',
    'Answer in the voice of a text message to a friend — casual, direct, a little snarky when warranted.',
    'Maximum 3 sentences. No bullet points. No headers.',
    'Never say: "Route A", "minutes saved", "optimal path", "utilize", "I recommend", "please note".',
    'If the game is more than 2 days away, lead with playful acknowledgment of how far out it is before giving the advice.',
    'If kickoff is under 2 hours away, match the urgency — short, fast, no fluff.',
    'If MARTA is delayed on the relevant line, acknowledge it directly and give a real alternative.',
    'Speak like you live here. Be specific about station names and walking directions when relevant.',
  ].join('\n');
}

function buildTimeString(kickoff_utc: string): string {
  const kickoffMs = new Date(kickoff_utc).getTime();
  const minutesUntil = Math.floor((kickoffMs - Date.now()) / 60_000);

  if (minutesUntil <= 0) return 'the game has already started';
  if (minutesUntil < 60) return `${minutesUntil} minutes until kickoff`;

  const hoursUntil = Math.floor(minutesUntil / 60);
  if (hoursUntil < 48) {
    const minsRemaining = minutesUntil % 60;
    return `${hoursUntil}h ${minsRemaining}m until kickoff`;
  }

  const daysUntil = Math.floor(hoursUntil / 24);
  const hoursRemaining = hoursUntil % 24;
  return hoursRemaining > 0
    ? `${daysUntil} days and ${hoursRemaining} hours until kickoff`
    : `${daysUntil} days until kickoff`;
}

export function buildUserPrompt(
  zone: Zone,
  match: Match,
  delayState: DelayState,
): string {
  const teams =
    match.team_a === 'TBD'
      ? `the ${match.stage} match`
      : `${match.team_a} vs ${match.team_b} (${match.stage})`;

  return [
    `Fan is going to ${teams} at Mercedes-Benz Stadium in Atlanta.`,
    `They are starting from: ${ZONE_DESCRIPTIONS[zone]}.`,
    `Kickoff: ${match.kickoff_utc} UTC (${buildTimeString(match.kickoff_utc)}).`,
    DELAY_CONTEXT[delayState],
    'How do I get to the game?',
  ].join('\n');
}
