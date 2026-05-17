import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Match, Threshold } from "@/data/matches";
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

// Reverse map: API-Football league id -> our internal league id.
const API_TO_INTERNAL = new Map<number, string>(
  Object.entries(API_LEAGUE).map(([k, v]) => [v.id, k]),
);

// ---------- Server-side cache (per-isolate). ----------
// Live endpoint: 5min — the "minute >= 65" check has minute granularity.
// Standings: 24h — table positions barely shift mid-day.
type CacheEntry<T> = { data: T; expires: number };
const LIVE_TTL_MS = 5 * 60 * 1000;
const STANDINGS_TTL_MS = 24 * 60 * 60 * 1000;

function getCache(): Map<string, CacheEntry<unknown>> {
  const g = globalThis as unknown as { __stakesfc_cache?: Map<string, CacheEntry<unknown>> };
  if (!g.__stakesfc_cache) g.__stakesfc_cache = new Map();
  return g.__stakesfc_cache;
}

async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
  const cache = getCache();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.data;
  const data = await loader();
  cache.set(key, { data, expires: Date.now() + ttl });
  return data;
}

// ---------- Throttled request queue + daily budget ----------
const MIN_GAP_MS = 7500; // ~8 req/min
const COOLDOWN_MS = 60_000;
const DAILY_BUDGET = 90; // leave a 10-call buffer under the 100/day limit

type QueueState = {
  chain: Promise<void>;
  lastCall: number;
  cooldownUntil: number;
  dayKey: string;
  dayCount: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getQueue(): QueueState {
  const g = globalThis as unknown as { __stakesfc_queue?: QueueState };
  if (!g.__stakesfc_queue) {
    g.__stakesfc_queue = {
      chain: Promise.resolve(),
      lastCall: 0,
      cooldownUntil: 0,
      dayKey: todayKey(),
      dayCount: 0,
    };
  }
  const q = g.__stakesfc_queue;
  const today = todayKey();
  if (q.dayKey !== today) {
    q.dayKey = today;
    q.dayCount = 0;
  }
  return q;
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const q = getQueue();
  if (Date.now() < q.cooldownUntil) {
    return Promise.reject(
      new Error("API-Football rate-limited — cooling down, try again shortly"),
    );
  }
  if (q.dayCount >= DAILY_BUDGET) {
    return Promise.reject(
      new Error("Daily API-Football budget reached — resets at UTC midnight"),
    );
  }
  const run = async (): Promise<T> => {
    const now = Date.now();
    const waitForGap = Math.max(0, q.lastCall + MIN_GAP_MS - now);
    if (waitForGap > 0) await new Promise((r) => setTimeout(r, waitForGap));
    q.lastCall = Date.now();
    q.dayCount++;
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
    if (res.status === 401 || res.status === 403) {
      // Hard auth/plan error — stop hammering for the rest of the day.
      const q = getQueue();
      q.cooldownUntil = Date.now() + 24 * 60 * 60 * 1000;
      throw new Error(
        `API-Football ${res.status} — your RapidAPI key or plan is being rejected. Check the RAPIDAPI_FOOTBALL_KEY value and that your RapidAPI subscription has access to api-football-v1.`,
      );
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

type LiveFixture = {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; season: number };
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
  return "Live · Past 65'";
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
  if (stakes.includes("title")) parts.push("Three points here could swing the title race.");
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

// Continental cutoff = top 4; relegation cutoff = bottom 3 (rank > total - 3).
const CONTINENTAL_CUTOFF = 4;
const RELEGATION_SIZE = 3;

function computeThreshold(
  position: number,
  points: number,
  pointsByRank: number[],
  total: number,
): Threshold {
  const relegationLine = total - RELEGATION_SIZE; // last safe rank
  // Title context
  if (position === 1) {
    const second = pointsByRank[1] ?? points;
    const lead = points - second;
    return { label: lead > 0 ? `+${lead} lead at top` : "Tied at top", delta: lead, kind: "title" };
  }
  if (position === 2) {
    const first = pointsByRank[0] ?? points;
    const gap = points - first; // negative
    return { label: `${gap} to title`, delta: gap, kind: "title" };
  }
  // Relegation zone or fighting near it
  if (position > relegationLine) {
    // In drop zone — gap to safety (negative)
    const safety = pointsByRank[relegationLine - 1] ?? points;
    const gap = points - safety;
    return { label: `${gap} to safety`, delta: gap, kind: "relegation" };
  }
  if (position >= relegationLine - 1) {
    // Just above the line — cushion above first drop spot
    const firstDrop = pointsByRank[relegationLine] ?? points;
    const cushion = points - firstDrop;
    return {
      label: cushion > 0 ? `+${cushion} above drop` : "On the drop line",
      delta: cushion,
      kind: "relegation",
    };
  }
  // Continental window
  if (position <= CONTINENTAL_CUTOFF) {
    const firstOut = pointsByRank[CONTINENTAL_CUTOFF] ?? points;
    const cushion = points - firstOut;
    return {
      label: cushion > 0 ? `+${cushion} UCL cushion` : "On the UCL line",
      delta: cushion,
      kind: "continental",
    };
  }
  if (position <= CONTINENTAL_CUTOFF + 3) {
    const lastIn = pointsByRank[CONTINENTAL_CUTOFF - 1] ?? points;
    const gap = points - lastIn; // negative
    return { label: `${gap} from Europe`, delta: gap, kind: "continental" };
  }
  // Mid-table
  return { label: "Mid-table", delta: 0, kind: "neutral" };
}

// In-play status codes where `elapsed` reflects real match minute (excludes HT).
const IN_PLAY = new Set(["2H", "ET", "BT", "P", "LIVE"]);
const MIN_MINUTE = 65;

async function fetchStandings(
  leagueId: string,
): Promise<{
  lookup: Map<number, { position: number; points: number }>;
  pointsByRank: number[]; // index 0 = rank 1
  total: number;
} | null> {
  const cfg = API_LEAGUE[leagueId];
  if (!cfg) return null;
  return cached(`standings:${leagueId}:${cfg.season}`, STANDINGS_TTL_MS, async () => {
    const standings = await apiFootball<Standings>("standings", {
      league: cfg.id,
      season: cfg.season,
    });
    const table = standings[0]?.league.standings[0] ?? [];
    const lookup = new Map<number, { position: number; points: number }>();
    const pointsByRank: number[] = [];
    for (const row of table) {
      lookup.set(row.team.id, { position: row.rank, points: row.points });
      pointsByRank[row.rank - 1] = row.points;
    }
    return { lookup, pointsByRank, total: table.length };
  });
}

async function fetchLiveFixtures(): Promise<LiveFixture[]> {
  return cached("live:all", LIVE_TTL_MS, async () =>
    apiFootball<LiveFixture[]>("fixtures", { live: "all" }),
  );
}

export const getLiveMatches = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      leagueIds: z.array(z.string().min(1).max(32)).min(1).max(25),
    }),
  )
  .handler(async ({ data }) => {
    const selected = new Set(data.leagueIds);

    let live: LiveFixture[];
    try {
      live = await fetchLiveFixtures();
    } catch (err) {
      console.error("[football] live fetch failed:", err);
      return {
        matches: [] as Match[],
        error: err instanceof Error ? err.message : "unknown",
        budget: getQueue().dayCount,
      };
    }

    // Filter to: configured league, selected by user, past 65', actually in play.
    const qualifying = live.filter((fx) => {
      const internal = API_TO_INTERNAL.get(fx.league.id);
      if (!internal || !selected.has(internal)) return false;
      if (!IN_PLAY.has(fx.fixture.status.short)) return false;
      const minute = fx.fixture.status.elapsed ?? 0;
      return minute >= MIN_MINUTE;
    });

    // Group by league so we only fetch each league's standings once.
    const byLeague = new Map<string, LiveFixture[]>();
    for (const fx of qualifying) {
      const internal = API_TO_INTERNAL.get(fx.league.id)!;
      const arr = byLeague.get(internal) ?? [];
      arr.push(fx);
      byLeague.set(internal, arr);
    }

    const matches: Match[] = [];
    for (const [leagueId, fixtures] of byLeague) {
      let standings: Awaited<ReturnType<typeof fetchStandings>> = null;
      try {
        standings = await fetchStandings(leagueId);
      } catch (err) {
        console.error(`[football] standings ${leagueId} failed:`, err);
      }

      for (const fx of fixtures) {
        const h = standings?.lookup.get(fx.teams.home.id);
        const a = standings?.lookup.get(fx.teams.away.id);
        const total = standings?.total ?? 20;
        const homePos = h?.position ?? 0;
        const awayPos = a?.position ?? 0;
        const stakes = h && a ? computeStakes(homePos, awayPos, total) : [];

        const homeThreshold = h && standings
          ? computeThreshold(h.position, h.points, standings.pointsByRank, standings.total)
          : undefined;
        const awayThreshold = a && standings
          ? computeThreshold(a.position, a.points, standings.pointsByRank, standings.total)
          : undefined;

        const homeTeam = {
          name: fx.teams.home.name,
          short: shortName(fx.teams.home.name),
          position: homePos,
          points: h?.points ?? 0,
          color: colorFor(fx.teams.home.name),
          threshold: homeThreshold,
        };
        const awayTeam = {
          name: fx.teams.away.name,
          short: shortName(fx.teams.away.name),
          position: awayPos,
          points: a?.points ?? 0,
          color: colorFor(fx.teams.away.name),
          threshold: awayThreshold,
        };

        matches.push({
          id: `${leagueId}-${fx.fixture.id}`,
          leagueId,
          date: fx.fixture.date,
          status: "live",
          liveMinute: fx.fixture.status.elapsed ?? undefined,
          homeScore: fx.goals.home ?? undefined,
          awayScore: fx.goals.away ?? undefined,
          home: homeTeam,
          away: awayTeam,
          stakes,
          stakesLabel: buildLabel(stakes),
          stakesExplainer:
            h && a
              ? buildExplainer(homeTeam, awayTeam, total, stakes)
              : `${fx.teams.home.name} vs ${fx.teams.away.name} — live past the 65th minute.`,
        });
      }
    }

    return { matches, error: null as string | null, budget: getQueue().dayCount };
  });
