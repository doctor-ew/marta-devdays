import { z } from "zod";

export const MatchSchema = z.object({
  match_id: z.string().min(1),
  team_a: z.string().min(1),
  team_b: z.string().min(1),
  kickoff_utc: z.string().datetime(),
  stage: z.string().min(1),
  group: z.string().nullable(),
});

export type Match = z.infer<typeof MatchSchema>;

export const MatchArraySchema = z.array(MatchSchema);

export const RecommendRequestSchema = z.object({
  zone: z.enum(["Downtown", "Midtown", "Airport"]),
  match: MatchSchema,
  injectDelay: z.boolean(),
});
