import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { StakeType } from "@/data/leagues";

export interface FixtureDTO {
  id: string;
  leagueId: string;
  date: string;
  status: "upcoming" | "live";
  liveMinute: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isKnockout: boolean;
  roundLabel: string | null;
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
    // Fetch live games (unbounded) + next 5 upcoming separately so live always shows on top.
    const sinceFresh = new Date(Date.now() - 3 * 3600 * 1000).toISOString();

    let liveQ = supabaseAdmin
      .from("fixtures_cache")
      .select("*")
      .eq("status", "live")
      .order("kickoff_utc", { ascending: true });

    let upcomingQ = supabaseAdmin
      .from("fixtures_cache")
      .select("*")
      .eq("status", "upcoming")
      .gte("kickoff_utc", sinceFresh)
      .order("kickoff_utc", { ascending: true })
      .limit(5);

    if (data.leagueIds && data.leagueIds.length > 0) {
      liveQ = liveQ.in("league_id", data.leagueIds);
      upcomingQ = upcomingQ.in("league_id", data.leagueIds);
    }

    const [{ data: liveRows, error: liveErr }, { data: upRows, error: upErr }] = await Promise.all([
      liveQ,
      upcomingQ,
    ]);
    if (liveErr) console.error("[fixtures] live query failed", liveErr);
    if (upErr) console.error("[fixtures] upcoming query failed", upErr);

    const rows = [...(liveRows ?? []), ...(upRows ?? [])];

    return rows.map((r) => ({
      id: r.id,
      leagueId: r.league_id,
      date: r.kickoff_utc,
      status: (r.status as "upcoming" | "live") ?? "upcoming",
      liveMinute: r.live_minute ?? null,
      homeScore: r.home_score ?? null,
      awayScore: r.away_score ?? null,
      isKnockout: !!r.is_knockout,
      roundLabel: r.round_label ?? null,
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
