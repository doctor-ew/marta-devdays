import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { FALLBACK_RESPONSES, type Zone } from "@/lib/fallbacks";
import { RecommendRequestSchema } from "@/lib/schemas";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a local Atlanta friend who knows MARTA well. You help FIFA World Cup fans get to Mercedes-Benz Stadium. You speak plainly, like someone texting a friend. Never sound like a transit app. Never say "Route A", "minutes saved", or "optimal path." If MARTA is bad, say so and give the real workaround. Max 3 sentences.`;

function getFallback(zone: string, injectDelay: boolean): string {
  const key = (zone as Zone) in FALLBACK_RESPONSES ? (zone as Zone) : "generic";
  return FALLBACK_RESPONSES[key][injectDelay ? "delay" : "normal"];
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = RecommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Missing or invalid zone or match", { status: 400 });
  }

  const { zone, match, injectDelay } = parsed.data;

  // Kill switch: skip Anthropic, return pre-baked response
  if (process.env.USE_MOCK_CLAUDE === "true") {
    return new Response(getFallback(zone, injectDelay), {
      headers: { "Content-Type": "text/plain" },
    });
  }

  const statusString = injectDelay
    ? "Gold Line: Moderate congestion — 20+ min delays at Vine City"
    : "Gold Line and Blue Line running on schedule";

  const minutesToKickoff = Math.round(
    (new Date(match.kickoff_utc).getTime() - Date.now()) / 60000
  );

  const userPrompt = `I'm in ${zone}. The match (${match.team_a} vs ${match.team_b}) kicks off in ${minutesToKickoff} minutes. MARTA status: ${statusString}. What should I do?`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const result = await streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      abortSignal: controller.signal,
    });

    clearTimeout(timeout);
    return result.toTextStreamResponse();
  } catch {
    clearTimeout(timeout);
    return new Response(getFallback(zone, injectDelay), {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
