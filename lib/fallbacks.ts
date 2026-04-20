import type { Zone, DelayState } from '@/types';

export const fallbacks: Record<Zone, Record<DelayState, string>> = {
  downtown: {
    normal:
      "Grab the Blue Line at Five Points — one stop straight to Vine City, about 4 minutes. Get there 90 minutes early and you'll beat the crush. MARTA's looking clean right now.",
    blue_line_delay:
      "Blue Line's backed up today — walk from Five Points, it's about 12 minutes straight down Mitchell St to the stadium. Quicker than waiting on a delayed train.",
  },
  midtown: {
    normal:
      "Take the Red or Gold Line south from Arts Center to Five Points, then switch to the Blue Line one stop to Vine City — total about 15 minutes. Leave at least 90 minutes before kickoff.",
    blue_line_delay:
      "Blue Line has delays, so ride Red or Gold to Five Points and walk the rest — 12 minutes on foot down Mitchell is faster than sitting on a delayed train.",
  },
  airport: {
    normal:
      "You're in great shape — take the Red or Gold Line from College Park straight into downtown, transfer to the Blue Line at Five Points for one stop to Vine City. About 35 minutes total.",
    blue_line_delay:
      "Blue Line's slow today so ride Red or Gold to Five Points and walk to the stadium from there — 12 minutes, totally doable, and you'll beat everyone stuck waiting.",
  },
  decatur: {
    normal:
      "Blue Line from Decatur west to Vine City is direct — about 20 minutes, no transfer needed. It goes straight past Five Points and drops you right at the stadium neighborhood.",
    blue_line_delay:
      "Blue Line is delayed today, which is rough from Decatur since that's your only direct option. Rideshare to Five Points and walk from there, or leave extra early and hope it clears.",
  },
  dunwoody: {
    normal:
      "Red Line from Dunwoody south to Five Points, then one stop on the Blue Line to Vine City — about 35 minutes total. Trains are running clean so just leave 90 minutes early.",
    blue_line_delay:
      "Blue Line is delayed so once you get to Five Points on the Red Line, skip waiting and walk — it's 12 minutes down Mitchell St and honestly faster than a delayed train right now.",
  },
};

export function getFallback(zone: Zone, delayState: DelayState): string {
  return fallbacks[zone][delayState];
}
