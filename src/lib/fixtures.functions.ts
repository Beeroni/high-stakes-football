import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { StakeType } from "@/data/leagues";

export interface FixtureDTO {
  id: string;
  leagueId: string;
  date: string;
  status: "upcoming" | "live";
  home: { name: string; short: string; position: number; points: number; color: string };
  away: { name: string; short: string; position: number; points: number; color: string };
  stakes: StakeType[];
  stakesLabel: string;
  stakesExplainer: string;
}

const DEFAULT_COLOR = "#475569";

export const getUpcomingFixtures = createServerFn({ method: "GET" })
  .inputValidator((input: { leagueIds?: string[] } | undefined) =>
    z.object({ leagueIds: z.array(z.string()).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<FixtureDTO[]> => {
    let query = supabaseAdmin
      .from("fixtures_cache")
      .select("*")
      .gte("kickoff_utc", new Date(Date.now() - 3 * 3600 * 1000).toISOString())
      .order("kickoff_utc", { ascending: true })
      .limit(5); // Hard cap: 5 soonest upcoming games to stay under API quotas.

    if (data.leagueIds && data.leagueIds.length > 0) {
      query = query.in("league_id", data.leagueIds);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error("[fixtures] query failed", error);
      return [];
    }

    return (rows ?? []).map((r) => ({
      id: r.id,
      leagueId: r.league_id,
      date: r.kickoff_utc,
      status: (r.status as "upcoming" | "live") ?? "upcoming",
      home: {
        name: r.home_team,
        short: r.home_short,
        position: r.home_position ?? 0,
        points: r.home_points ?? 0,
        color: r.home_color ?? DEFAULT_COLOR,
      },
      away: {
        name: r.away_team,
        short: r.away_short,
        position: r.away_position ?? 0,
        points: r.away_points ?? 0,
        color: r.away_color ?? DEFAULT_COLOR,
      },
      stakes: (r.stakes ?? []) as StakeType[],
      stakesLabel: r.stakes_label,
      stakesExplainer: r.stakes_explainer,
    }));
  });
