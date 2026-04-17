import { HomeClient } from "./HomeClient";
import matchesData from "../../public/matches.json";
import { MatchArraySchema } from "@/lib/schemas";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ inject_delay?: string }>;
}) {
  const params = await searchParams;
  const injectDelay = params.inject_delay === "gold_line";

  // Validate at startup — throws (500) if matches.json is malformed
  const matches = MatchArraySchema.parse(matchesData);

  return <HomeClient matches={matches} injectDelay={injectDelay} />;
}
