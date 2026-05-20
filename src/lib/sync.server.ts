// Server-only: fetches fixtures + standings from TheSportsDB and upserts to cache tables.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LEAGUES, type League, type StakeType } from "@/data/leagues";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";

interface TSDBEvent {
  idEvent: string;
  idLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strStatus?: string | null;
}

interface TSDBStandingRow {
  idTeam: string;
  strTeam: string;
  intRank: number | string;
  intPoints: number | string;
  intPlayed: number | string;
}

function shortName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts
    .slice(0, 3)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.error("[sync] fetch failed", url, e);
    return null;
  }
}

interface StandingEntry {
  position: number;
  points: number;
  played: number;
  name: string;
}

function inferStakes(
  league: League,
  team: StandingEntry | undefined,
  table: StandingEntry[],
): { stakes: StakeType[]; label: string; explainer: string } {
  if (!team || table.length === 0) {
    return { stakes: [], label: "Fixture", explainer: "League table data unavailable." };
  }
  const stakes: StakeType[] = [];
  const total = table.length || league.size;
  const pos = team.position;

  // Title race: top 2
  if (pos <= 2) stakes.push("title");
  // Continental qualification: positions 3..continentalSlots
  else if (league.continentalSlots > 0 && pos <= league.continentalSlots) {
    stakes.push("continental");
  }
  // Relegation zone or just above
  if (league.relegationSlots > 0 && pos >= total - league.relegationSlots - 1) {
    stakes.push("relegation");
  }

  let label = "Mid-table clash";
  let explainer = `${team.name} sit ${ordinal(pos)} with ${team.points} pts.`;

  if (stakes.includes("title")) {
    const leader = table[0];
    const gap = leader.points - team.points;
    label = "Title race";
    explainer =
      pos === 1
        ? `${team.name} lead the table on ${team.points} pts. A win tightens their grip on the title.`
        : `${team.name} are ${gap} pt${gap === 1 ? "" : "s"} behind leaders ${leader.name}. Every dropped point could decide the title.`;
  } else if (stakes.includes("continental")) {
    label = "Continental spot";
    explainer = `${team.name} are ${ordinal(pos)}, fighting for a continental qualification place.`;
  } else if (stakes.includes("relegation")) {
    const dropLine = total - league.relegationSlots;
    const safeTeam = table[dropLine - 1];
    const cushion = safeTeam ? team.points - (table[dropLine]?.points ?? 0) : 0;
    label = "Relegation battle";
    explainer =
      pos > dropLine
        ? `${team.name} sit ${ordinal(pos)} — inside the relegation zone. They need points to climb out.`
        : `${team.name} are just above the drop with only a ${cushion}-pt cushion. A loss could send them into the relegation zone.`;
  }

  return { stakes, label, explainer };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

async function syncLeague(league: League): Promise<{ league: string; fixtures: number; standings: number }> {
  // 1. Standings
  const standingsRes = await safeFetch<{ table: TSDBStandingRow[] | null }>(
    `${BASE}/lookuptable.php?l=${league.sportsdbId}`,
  );
  const table: StandingEntry[] = (standingsRes?.table ?? []).map((r) => ({
    position: Number(r.intRank),
    points: Number(r.intPoints),
    played: Number(r.intPlayed),
    name: r.strTeam,
  }));
  table.sort((a, b) => a.position - b.position);

  if (table.length > 0) {
    await supabaseAdmin.from("standings_cache").delete().eq("league_id", league.id);
    await supabaseAdmin.from("standings_cache").insert(
      table.map((t) => ({
        league_id: league.id,
        team_name: t.name,
        position: t.position,
        points: t.points,
        played: t.played,
      })),
    );
  }

  // 2. Next fixtures
  const fixturesRes = await safeFetch<{ events: TSDBEvent[] | null }>(
    `${BASE}/eventsnextleague.php?id=${league.sportsdbId}`,
  );
  const events = fixturesRes?.events ?? [];

  const tableByName = new Map(table.map((t) => [t.name.toLowerCase(), t]));

  const rows = events
    .map((ev) => {
      const kickoff =
        ev.strTimestamp ??
        (ev.dateEvent && ev.strTime ? `${ev.dateEvent}T${ev.strTime}Z` : null);
      if (!kickoff) return null;
      const home = tableByName.get(ev.strHomeTeam.toLowerCase());
      const away = tableByName.get(ev.strAwayTeam.toLowerCase());
      const focus = (() => {
        if (!home && !away) return undefined;
        if (!home) return away;
        if (!away) return home;
        // Prefer the more dramatic team
        const homeStakes = inferStakes(league, home, table).stakes.length;
        const awayStakes = inferStakes(league, away, table).stakes.length;
        return awayStakes > homeStakes ? away : home;
      })();
      const { stakes, label, explainer } = inferStakes(league, focus, table);

      return {
        id: ev.idEvent,
        league_id: league.id,
        home_team: ev.strHomeTeam,
        away_team: ev.strAwayTeam,
        home_short: shortName(ev.strHomeTeam),
        away_short: shortName(ev.strAwayTeam),
        home_position: home?.position ?? null,
        away_position: away?.position ?? null,
        home_points: home?.points ?? null,
        away_points: away?.points ?? null,
        home_color: null,
        away_color: null,
        kickoff_utc: new Date(kickoff).toISOString(),
        status: "upcoming",
        stakes,
        stakes_label: label,
        stakes_explainer: explainer,
        synced_at: new Date().toISOString(),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length > 0) {
    await supabaseAdmin.from("fixtures_cache").upsert(rows, { onConflict: "id" });
  }

  return { league: league.id, fixtures: rows.length, standings: table.length };
}

export async function syncAllLeagues() {
  const results: Array<{ league: string; fixtures: number; standings: number }> = [];
  // Sequential to be gentle on TheSportsDB rate limits
  for (const league of LEAGUES) {
    try {
      const r = await syncLeague(league);
      results.push(r);
      // small delay
      await new Promise((res) => setTimeout(res, 250));
    } catch (e) {
      console.error("[sync] league failed", league.id, e);
    }
  }

  // Prune past fixtures
  await supabaseAdmin
    .from("fixtures_cache")
    .delete()
    .lt("kickoff_utc", new Date(Date.now() - 6 * 3600 * 1000).toISOString());

  return results;
}
