export type Zone = "Downtown" | "Midtown" | "Airport";

interface ZoneFallbacks {
  normal: string;
  delay: string;
}

export const FALLBACK_RESPONSES: Record<Zone | "generic", ZoneFallbacks> = {
  Downtown: {
    normal:
      "You're golden — hop on the Gold Line at Five Points, it goes straight to Mercedes-Benz Stadium. Takes about 5 minutes. Get there early, the concourse fills up fast.",
    delay:
      "Skip the Gold Line right now, it's a mess near Vine City. Grab a rideshare directly to the stadium or just walk from Five Points — it's about 15 minutes and honestly not bad for a match day.",
  },
  Midtown: {
    normal:
      "Take the Gold Line southbound from Arts Center toward downtown — ride it straight to the stadium stop. Clean trip, maybe 12 minutes total.",
    delay:
      "Gold Line's delayed but you can still make it. Board at Arts Center, push through to Five Points, then walk from there — it's 15 minutes and faster than waiting out the backup near Vine City.",
  },
  Airport: {
    normal:
      "You're well-positioned — Airport station is on the Gold Line direct to the stadium. Straight shot, around 30 minutes. Plenty of trains running today.",
    delay:
      "Delays are near Vine City, not your end. Hop on at Airport and ride — you'll hit the slow stretch after Five Points but you should still make kickoff. Leave now.",
  },
  generic: {
    normal:
      "Take MARTA to the stadium — both the Gold and Blue lines stop right there. Check the next train and you'll be fine.",
    delay:
      "Gold Line has delays near Vine City right now. Rideshare to Five Points or the stadium directly — it's your safest bet to make the match.",
  },
};
