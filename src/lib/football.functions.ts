import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Match } from "@/data/matches";
import type { StakeType } from "@/data/leagues";

// Map our internal league IDs to API-Football's IDs + the current season.
const API_LEAGUE: Record<string, { id: number; season: number }> = {
  epl: { id: 39, season: 2025 },
  laliga: { id: 140, season: 2025 },
  seriea: { id: 135, season: 2025 },
  bundes: { id: 78, season: 2025 },
  ligue1: { id: 61, season: 2025 },
  eredivisie: { id: 88, season: 2025 },
  primeira: { id: 94, season: 2025 },
  spl: { id: 179, season: 2025 },
  belgian: { id: 144, season: 2025 },
  turkish: { id: 203, season: 2025 },
  greek: { id: 197, season: 2025 },
  austrian: { id: 218, season: 2025 },
  swiss: { id: 207, season: 2025 },
  danish: { id: 119, season: 2025 },
  championship: { id: 40, season: 2025 },
  saudi: { id: 307, season: 2025 },
  aleague: { id: 188, season: 2025 },
  brasileirao: { id: 71, season: 2026 },
  ligamx: { id: 262, season: 2026 },
  argentina: { id: 128, season: 2026 },
  colombia: { id: 239, season: 2026 },
  chile: { id: 265, season: 2026 },
  jleague: { id: 98, season: 2026 },
  kleague: { id: 292, season: 2026 },
  csl: { id: 169, season: 2026 },
};

// ---------- Server-side cache (per-isolate). 12h TTL keeps us comfortably
// under the 100 req/day RapidAPI free tier even across many visitors. ----------
type CacheEntry<T> = { data: T; expires: number };
const TTL_MS = 12 * 60 * 60 * 1000;

function getCache(): Map<string, CacheEntry<unknown>> {
  const g = globalThis as unknown as { __stakesfc_cache?: Map<string, CacheEntry<unknown>> };
  if (!g.__stakesfc_cache) g.__stakesfc_cache = new Map();
  return g.__stakesfc_cache;
}

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cache = getCache();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.data;
  const data = await loader();
  cache.set(key, { data, expires: Date.now() + TTL_MS });
  return data;
}

// ---------- Throttled request queue ----------
// RapidAPI free tier on API-Football enforces ~10 req/min + 100 req/day.
// Firing requests in parallel trips the per-minute limit and burns the
// daily quota instantly, so we serialize and pace requests at ~8/minute.
const MIN_GAP_MS = 7500; // ~8 req/min
const COOLDOWN_MS = 60_000; // pause new calls for 1m after a 429

type QueueState = {
  chain: Promise<void>;
  lastCall: number;
  cooldownUntil: number;
};

function getQueue(): QueueState {
  const g = globalThis as unknown as { __stakesfc_queue?: QueueState };
  if (!g.__stakesfc_queue) {
    g.__stakesfc_queue = { chain: Promise.resolve(), lastCall: 0, cooldownUntil: 0 };
  }
  return g.__stakesfc_queue;
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const q = getQueue();
  // Fail-fast while cooling down so callers don't pile up for minutes.
  if (Date.now() < q.cooldownUntil) {
    return Promise.reject(
      new Error("API-Football rate-limited — cooling down, try again shortly"),
    );
  }
  const run = async (): Promise<T> => {
    const now = Date.now();
    const waitForGap = Math.max(0, q.lastCall + MIN_GAP_MS - now);
    if (waitForGap > 0) await new Promise((r) => setTimeout(r, waitForGap));
    q.lastCall = Date.now();
    return fn();
  };
  const next = q.chain.then(run, run);
  q.chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

// ---------- API-Football fetch helper ----------
async function apiFootball<T = unknown>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const key = process.env.RAPIDAPI_FOOTBALL_KEY;
  if (!key) throw new Error("RAPIDAPI_FOOTBALL_KEY is not set");
  const url = new URL(`https://api-football-v1.p.rapidapi.com/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return enqueue(async () => {
    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });
    if (res.status === 429) {
      getQueue().cooldownUntil = Date.now() + COOLDOWN_MS;
      throw new Error("API-Football 429 Too Many Requests (rate-limited, cooling down)");
    }
    if (!res.ok) throw new Error(`API-Football ${res.status} ${res.statusText}`);
    const json = (await res.json()) as { response: T; errors?: unknown };
    return json.response;
  });
}


// ---------- Domain logic ----------
type StandingRow = {
  rank: number;
  points: number;
  team: { id: number; name: string };
};

type Standings = Array<{
  league: { standings: StandingRow[][] };
}>;

type Fixture = {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
};

function shortName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z ]/g, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts
    .slice(0, 3)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function colorFor(name: string): string {
  // Deterministic muted color from team name — looks ok in dark UI.
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 55% 42%)`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function computeStakes(homePos: number, awayPos: number, total: number): StakeType[] {
  const out = new Set<StakeType>();
  for (const pos of [homePos, awayPos]) {
    if (pos <= 2) out.add("title");
    if (pos >= 3 && pos <= 6) out.add("continental");
    if (pos >= total - 2) out.add("relegation");
  }
  return [...out];
}

function buildLabel(stakes: StakeType[]): string {
  if (stakes.includes("title")) return "Title Race";
  if (stakes.includes("relegation")) return "Relegation Battle";
  if (stakes.includes("continental")) return "European Qualification";
  return "";
}

function buildExplainer(
  home: { name: string; position: number; points: number },
  away: { name: string; position: number; points: number },
  total: number,
  stakes: StakeType[],
): string {
  const parts: string[] = [];
  parts.push(
    `${home.name} (${ordinal(home.position)}, ${home.points} pts) vs ${away.name} (${ordinal(away.position)}, ${away.points} pts).`,
  );
  if (stakes.includes("title")) {
    parts.push("Three points here could swing the title race.");
  }
  if (stakes.includes("relegation")) {
    const dangerTeam =
      home.position >= total - 2 ? home.name : away.position >= total - 2 ? away.name : null;
    if (dangerTeam) parts.push(`${dangerTeam} need a result to escape the drop zone.`);
  }
  if (stakes.includes("continental") && !stakes.includes("title")) {
    parts.push("A continental qualification spot is on the line.");
  }
  return parts.join(" ");
}

function mapStatus(short: string): "live" | "upcoming" | "finished" {
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  return "upcoming";
}

async function fetchLeagueMatches(leagueId: string): Promise<Match[] | null> {
  const cfg = API_LEAGUE[leagueId];
  if (!cfg) return null;

  return cached(`league:${leagueId}:${cfg.season}`, async () => {
    const [standings, fixtures] = await Promise.all([
      apiFootball<Standings>("standings", { league: cfg.id, season: cfg.season }),
      apiFootball<Fixture[]>("fixtures", { league: cfg.id, season: cfg.season, next: 12 }),
    ]);

    const table = standings[0]?.league.standings[0] ?? [];
    if (table.length === 0) return [];
    const lookup = new Map<number, { position: number; points: number }>();
    for (const row of table) lookup.set(row.team.id, { position: row.rank, points: row.points });
    const total = table.length;

    const matches: Match[] = [];
    for (const fx of fixtures) {
      const h = lookup.get(fx.teams.home.id);
      const a = lookup.get(fx.teams.away.id);
      if (!h || !a) continue;
      const stakes = computeStakes(h.position, a.position, total);
      if (stakes.length === 0) continue; // only show stakes-relevant matches

      const homeTeam = {
        name: fx.teams.home.name,
        short: shortName(fx.teams.home.name),
        position: h.position,
        points: h.points,
        color: colorFor(fx.teams.home.name),
      };
      const awayTeam = {
        name: fx.teams.away.name,
        short: shortName(fx.teams.away.name),
        position: a.position,
        points: a.points,
        color: colorFor(fx.teams.away.name),
      };

      const status = mapStatus(fx.fixture.status.short);
      if (status === "finished") continue;

      matches.push({
        id: `${leagueId}-${fx.fixture.id}`,
        leagueId,
        date: fx.fixture.date,
        status,
        liveMinute: status === "live" ? fx.fixture.status.elapsed ?? undefined : undefined,
        homeScore: fx.goals.home ?? undefined,
        awayScore: fx.goals.away ?? undefined,
        home: homeTeam,
        away: awayTeam,
        stakes,
        stakesLabel: buildLabel(stakes),
        stakesExplainer: buildExplainer(homeTeam, awayTeam, total, stakes),
      });
    }

    return matches;
  });
}

export const getLiveMatches = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      leagueIds: z.array(z.string().min(1).max(32)).min(1).max(25),
    }),
  )
  .handler(async ({ data }) => {
    const results = await Promise.all(
      data.leagueIds.map(async (id) => {
        try {
          const matches = await fetchLeagueMatches(id);
          return { leagueId: id, matches, error: null as string | null };
        } catch (err) {
          console.error(`[football] ${id} failed:`, err);
          return {
            leagueId: id,
            matches: null,
            error: err instanceof Error ? err.message : "unknown",
          };
        }
      }),
    );
    return { leagues: results };
  });
