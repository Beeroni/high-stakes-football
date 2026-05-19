import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Match, Threshold } from "@/data/matches";
import type { StakeType } from "@/data/leagues";

// ---------------------------------------------------------------------------
// SofaScore unique-tournament IDs per internal league.
// Season ids are resolved at runtime via `/seasons` (most recent first) so we
// don't have to hardcode them every year.
// ---------------------------------------------------------------------------
const SOFA_LEAGUE: Record<string, number> = {
  epl: 17,
  laliga: 8,
  seriea: 23,
  bundes: 35,
  ligue1: 34,
  eredivisie: 37,
  primeira: 238,
  spl: 36,
  belgian: 38,
  turkish: 52,
  greek: 185,
  austrian: 45,
  swiss: 215,
  danish: 39,
  championship: 18,
  saudi: 955,
  aleague: 10,
  brasileirao: 325,
  ligamx: 11621,
  argentina: 155,
  colombia: 329,
  chile: 11653,
  jleague: 196,
  kleague: 586,
  csl: 679,
};

const TOURNAMENT_TO_INTERNAL = new Map<number, string>(
  Object.entries(SOFA_LEAGUE).map(([k, v]) => [v, k]),
);

// ---------- Cache (per-isolate) ----------
type CacheEntry<T> = { data: T; expires: number };
const LIVE_TTL_MS = 5 * 60 * 1000;
const SCHEDULED_TTL_MS = 6 * 60 * 60 * 1000;
const STANDINGS_TTL_MS = 24 * 60 * 60 * 1000;
const META_TTL_MS = 24 * 60 * 60 * 1000;

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

// Negative cache for failed lookups so we don't hammer when a league is broken.
async function cachedNullable<T>(
  key: string,
  ttl: number,
  loader: () => Promise<T | null>,
): Promise<T | null> {
  return cached(key, ttl, loader);
}

// ---------- Throttled request queue + daily budget ----------
const MIN_GAP_MS = 2000;
const COOLDOWN_MS = 60_000;
const BLOCK_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_BUDGET = 500;

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
      new Error("SofaScore is cooling down after a recent error — try again shortly"),
    );
  }
  if (q.dayCount >= DAILY_BUDGET) {
    return Promise.reject(
      new Error("Daily SofaScore budget reached — resets at UTC midnight"),
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

// ---------- SofaScore fetch helper ----------
const SOFA_BASE = "https://api.sofascore.com/api/v1";
const SOFA_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.sofascore.com",
  Referer: "https://www.sofascore.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

async function sofa<T = unknown>(path: string): Promise<T> {
  return enqueue(async () => {
    const res = await fetch(`${SOFA_BASE}/${path}`, { headers: SOFA_HEADERS });
    if (res.status === 429) {
      getQueue().cooldownUntil = Date.now() + COOLDOWN_MS;
      throw new Error("SofaScore 429 Too Many Requests (cooling down)");
    }
    if (res.status === 401 || res.status === 403) {
      getQueue().cooldownUntil = Date.now() + BLOCK_COOLDOWN_MS;
      throw new Error(
        `SofaScore ${res.status} — SofaScore is blocking requests from this server. Try again later.`,
      );
    }
    if (res.status === 404) {
      // Not really an error for nullable lookups; let caller decide.
      throw new Error(`SofaScore 404 ${path}`);
    }
    if (!res.ok) throw new Error(`SofaScore ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  });
}

async function sofaSafe<T = unknown>(path: string): Promise<T | null> {
  try {
    return await sofa<T>(path);
  } catch (err) {
    console.warn(`[sofa] ${path} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------- SofaScore response shapes ----------
type SofaEvent = {
  id: number;
  tournament: { uniqueTournament?: { id: number } };
  status: { code: number; type: string }; // type: 'inprogress' | 'finished' | 'notstarted' | 'postponed'
  startTimestamp: number;
  homeTeam: { id: number; name: string; shortName?: string };
  awayTeam: { id: number; name: string; shortName?: string };
  homeScore: { current?: number; display?: number };
  awayScore: { current?: number; display?: number };
  time?: { initial?: number; max?: number; extra?: number; currentPeriodStartTimestamp?: number };
};

type SofaStandingRow = {
  team: { id: number; name: string };
  position: number;
  points: number;
};

type SofaStandings = {
  standings: Array<{ rows: SofaStandingRow[]; type: string }>;
};

type SofaSeasons = { seasons: Array<{ id: number; year: string; name: string }> };

type SofaRounds = {
  rounds: Array<{ round: number }>;
  currentRound?: { round: number };
};

// ---------- Domain helpers (unchanged) ----------
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
  return `hsl(${h % 360} 55% 42%)`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const CONTINENTAL_CUTOFF = 4;
const RELEGATION_SIZE = 3;

// Max points a team can still earn with `remainingRounds` matches left.
function maxGain(remainingRounds: number): number {
  return Math.max(0, remainingRounds) * 3;
}

type Contention = { title: boolean; continental: boolean; relegation: boolean };

// A team is in contention for a stake only when remaining fixtures can still
// change their position relative to the threshold line.
function teamContention(
  position: number,
  points: number,
  pointsByRank: number[],
  total: number,
  remainingRounds: number,
): Contention {
  const gain = maxGain(remainingRounds);
  const leader = pointsByRank[0] ?? points;
  const second = pointsByRank[1] ?? points;
  const ucl = pointsByRank[CONTINENTAL_CUTOFF - 1] ?? points;
  const firstOutUcl = pointsByRank[CONTINENTAL_CUTOFF] ?? points;
  const relegationLine = total - RELEGATION_SIZE;
  const safety = pointsByRank[relegationLine - 1] ?? points;
  const firstDrop = pointsByRank[relegationLine] ?? points;

  const title =
    position === 1
      ? leader - second <= gain // chasers can still catch
      : points + gain >= leader; // chaser can reach leader

  const continental =
    position <= CONTINENTAL_CUTOFF
      ? points - firstOutUcl <= gain
      : points + gain >= ucl;

  const relegation =
    position > relegationLine
      ? points + gain >= safety
      : points - firstDrop <= gain;

  return { title, continental, relegation };
}

function computeStakes(homeCon: Contention, awayCon: Contention): StakeType[] {
  const out = new Set<StakeType>();
  if (homeCon.title || awayCon.title) out.add("title");
  if (homeCon.continental || awayCon.continental) out.add("continental");
  if (homeCon.relegation || awayCon.relegation) out.add("relegation");
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
  remainingRounds: number,
): string {
  const parts: string[] = [];
  parts.push(
    `${home.name} (${ordinal(home.position)}, ${home.points} pts) vs ${away.name} (${ordinal(away.position)}, ${away.points} pts).`,
  );
  if (remainingRounds > 0) {
    parts.push(
      `${remainingRounds} match${remainingRounds === 1 ? "" : "es"} left — up to ${maxGain(remainingRounds)} pts in play.`,
    );
  }
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

function computeThreshold(
  position: number,
  points: number,
  pointsByRank: number[],
  total: number,
): Threshold {
  const relegationLine = total - RELEGATION_SIZE;
  if (position === 1) {
    const second = pointsByRank[1] ?? points;
    const lead = points - second;
    return { label: lead > 0 ? `+${lead} lead at top` : "Tied at top", delta: lead, kind: "title" };
  }
  if (position === 2) {
    const first = pointsByRank[0] ?? points;
    const gap = points - first;
    return { label: `${gap} to title`, delta: gap, kind: "title" };
  }
  if (position > relegationLine) {
    const safety = pointsByRank[relegationLine - 1] ?? points;
    const gap = points - safety;
    return { label: `${gap} to safety`, delta: gap, kind: "relegation" };
  }
  if (position >= relegationLine - 1) {
    const firstDrop = pointsByRank[relegationLine] ?? points;
    const cushion = points - firstDrop;
    return {
      label: cushion > 0 ? `+${cushion} above drop` : "On the drop line",
      delta: cushion,
      kind: "relegation",
    };
  }
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
    const gap = points - lastIn;
    return { label: `${gap} from Europe`, delta: gap, kind: "continental" };
  }
  return { label: "Mid-table", delta: 0, kind: "neutral" };
}

// ---------- League meta: season id + final-stretch flag ----------
type LeagueMeta = {
  tournamentId: number;
  seasonId: number;
  totalRounds: number | null;
  currentRound: number | null;
  inFinalStretch: boolean;
};

const FINAL_STRETCH_ROUNDS = 5; // last 5 matchdays

async function getLeagueMeta(internal: string): Promise<LeagueMeta | null> {
  const tournamentId = SOFA_LEAGUE[internal];
  if (!tournamentId) return null;

  return cachedNullable(`meta:${internal}`, META_TTL_MS, async () => {
    const seasons = await sofaSafe<SofaSeasons>(`unique-tournament/${tournamentId}/seasons`);
    const seasonId = seasons?.seasons?.[0]?.id;
    if (!seasonId) return null;

    const rounds = await sofaSafe<SofaRounds>(
      `unique-tournament/${tournamentId}/season/${seasonId}/rounds`,
    );
    const totalRounds = rounds?.rounds?.length ?? null;
    const currentRound = rounds?.currentRound?.round ?? null;
    const inFinalStretch =
      totalRounds != null && currentRound != null
        ? currentRound >= totalRounds - (FINAL_STRETCH_ROUNDS - 1)
        : false;

    return { tournamentId, seasonId, totalRounds, currentRound, inFinalStretch };
  });
}

// ---------- Today's scheduled tournaments (cheap, 1 call/6h) ----------
async function getTournamentsScheduledToday(): Promise<Set<number>> {
  const date = todayKey();
  const data = await cached(`scheduled:${date}`, SCHEDULED_TTL_MS, async () => {
    try {
      return await sofa<{ events: SofaEvent[] }>(`sport/football/scheduled-events/${date}`);
    } catch (err) {
      console.warn("[sofa] scheduled-events failed:", err);
      return { events: [] as SofaEvent[] };
    }
  });
  const set = new Set<number>();
  for (const ev of data.events ?? []) {
    const t = ev.tournament?.uniqueTournament?.id;
    if (t) set.add(t);
  }
  return set;
}

// ---------- Standings ----------
async function fetchStandings(meta: LeagueMeta): Promise<{
  lookup: Map<number, { position: number; points: number }>;
  pointsByRank: number[];
  total: number;
} | null> {
  return cachedNullable(
    `standings:${meta.tournamentId}:${meta.seasonId}`,
    STANDINGS_TTL_MS,
    async () => {
      const data = await sofaSafe<SofaStandings>(
        `unique-tournament/${meta.tournamentId}/season/${meta.seasonId}/standings/total`,
      );
      const rows = data?.standings?.[0]?.rows ?? [];
      if (!rows.length) return null;
      const lookup = new Map<number, { position: number; points: number }>();
      const pointsByRank: number[] = [];
      for (const row of rows) {
        lookup.set(row.team.id, { position: row.position, points: row.points });
        pointsByRank[row.position - 1] = row.points;
      }
      return { lookup, pointsByRank, total: rows.length };
    },
  );
}

// ---------- Live fixtures ----------
async function fetchLiveFixtures(): Promise<SofaEvent[]> {
  const data = await cached(`live:all`, LIVE_TTL_MS, async () =>
    sofa<{ events: SofaEvent[] }>(`sport/football/events/live`),
  );
  return data.events ?? [];
}

// SofaScore status codes for in-play 2nd half / extra time / penalties.
// 7 = 2H, 8 = HT (skip), 9 = ET, 10 = AET (finished), 11 = penalties, etc.
// We additionally require `status.type === 'inprogress'`.
const IN_PLAY_CODES = new Set([7, 9, 11, 12, 13, 14, 15, 16]);
const MIN_MINUTE = 65;

function eventMinute(ev: SofaEvent): number {
  const start = ev.time?.currentPeriodStartTimestamp;
  const initial = ev.time?.initial ?? 0;
  if (start) {
    const elapsed = Math.floor(Date.now() / 1000 - start);
    return Math.max(0, Math.floor((initial + elapsed) / 60));
  }
  // Fallback: just use initial seconds → minutes if no live ticker.
  return Math.floor(initial / 60);
}

export const getLiveMatches = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      leagueIds: z.array(z.string().min(1).max(32)).min(1).max(25),
    }),
  )
  .handler(async ({ data }) => {
    const selected = new Set(data.leagueIds);

    // Step 1: figure out which leagues are eligible to poll today.
    let scheduledToday: Set<number>;
    try {
      scheduledToday = await getTournamentsScheduledToday();
    } catch (err) {
      console.error("[football] scheduled lookup failed:", err);
      return {
        matches: [] as Match[],
        error: err instanceof Error ? err.message : "unknown",
        budget: getQueue().dayCount,
      };
    }

    const eligibleMetas = new Map<string, LeagueMeta>();
    for (const internal of selected) {
      const tid = SOFA_LEAGUE[internal];
      if (!tid) continue;
      const hasGameToday = scheduledToday.has(tid);
      // Meta lookup is cached 24h, so this costs ~2 calls/league/day worst case.
      const meta = await getLeagueMeta(internal);
      if (!meta) continue;
      if (hasGameToday || meta.inFinalStretch) {
        eligibleMetas.set(internal, meta);
      }
    }

    if (eligibleMetas.size === 0) {
      return {
        matches: [] as Match[],
        error: null as string | null,
        budget: getQueue().dayCount,
      };
    }

    // Step 2: fetch live fixtures (single call, cached 5m).
    let live: SofaEvent[];
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

    // Step 3: filter to eligible leagues, in-play, past 65'.
    const qualifying = live.filter((ev) => {
      const tid = ev.tournament?.uniqueTournament?.id;
      if (!tid) return false;
      const internal = TOURNAMENT_TO_INTERNAL.get(tid);
      if (!internal || !eligibleMetas.has(internal)) return false;
      if (ev.status.type !== "inprogress") return false;
      if (!IN_PLAY_CODES.has(ev.status.code)) return false;
      return eventMinute(ev) >= MIN_MINUTE;
    });

    // Step 4: group by league for one standings fetch each.
    const byLeague = new Map<string, SofaEvent[]>();
    for (const ev of qualifying) {
      const internal = TOURNAMENT_TO_INTERNAL.get(ev.tournament!.uniqueTournament!.id)!;
      const arr = byLeague.get(internal) ?? [];
      arr.push(ev);
      byLeague.set(internal, arr);
    }

    const matches: Match[] = [];
    for (const [leagueId, events] of byLeague) {
      const meta = eligibleMetas.get(leagueId)!;
      let standings: Awaited<ReturnType<typeof fetchStandings>> = null;
      try {
        standings = await fetchStandings(meta);
      } catch (err) {
        console.error(`[football] standings ${leagueId} failed:`, err);
      }

      // Matches each team can still play (incl. current round).
      const remainingRounds =
        meta.totalRounds != null && meta.currentRound != null
          ? Math.max(0, meta.totalRounds - meta.currentRound + 1)
          : FINAL_STRETCH_ROUNDS;

      for (const ev of events) {
        const h = standings?.lookup.get(ev.homeTeam.id);
        const a = standings?.lookup.get(ev.awayTeam.id);
        const total = standings?.total ?? 20;
        const homePos = h?.position ?? 0;
        const awayPos = a?.position ?? 0;

        const homeCon =
          h && standings
            ? teamContention(h.position, h.points, standings.pointsByRank, standings.total, remainingRounds)
            : { title: false, continental: false, relegation: false };
        const awayCon =
          a && standings
            ? teamContention(a.position, a.points, standings.pointsByRank, standings.total, remainingRounds)
            : { title: false, continental: false, relegation: false };

        const stakes = h && a ? computeStakes(homeCon, awayCon) : [];

        // Skip matches where neither team is mathematically in any race.
        if (stakes.length === 0) continue;

        const homeThreshold =
          h && standings
            ? computeThreshold(h.position, h.points, standings.pointsByRank, standings.total)
            : undefined;
        const awayThreshold =
          a && standings
            ? computeThreshold(a.position, a.points, standings.pointsByRank, standings.total)
            : undefined;

        const homeTeam = {
          name: ev.homeTeam.name,
          short: ev.homeTeam.shortName?.slice(0, 4).toUpperCase() ?? shortName(ev.homeTeam.name),
          position: homePos,
          points: h?.points ?? 0,
          color: colorFor(ev.homeTeam.name),
          threshold: homeThreshold,
        };
        const awayTeam = {
          name: ev.awayTeam.name,
          short: ev.awayTeam.shortName?.slice(0, 4).toUpperCase() ?? shortName(ev.awayTeam.name),
          position: awayPos,
          points: a?.points ?? 0,
          color: colorFor(ev.awayTeam.name),
          threshold: awayThreshold,
        };

        matches.push({
          id: `${leagueId}-${ev.id}`,
          leagueId,
          date: new Date(ev.startTimestamp * 1000).toISOString(),
          status: "live",
          liveMinute: eventMinute(ev),
          homeScore: ev.homeScore.current ?? ev.homeScore.display ?? undefined,
          awayScore: ev.awayScore.current ?? ev.awayScore.display ?? undefined,
          home: homeTeam,
          away: awayTeam,
          stakes,
          stakesLabel: buildLabel(stakes),
          stakesExplainer:
            h && a
              ? buildExplainer(homeTeam, awayTeam, total, stakes, remainingRounds)
              : `${ev.homeTeam.name} vs ${ev.awayTeam.name} — live past the 65th minute.`,
        });
      }
    }

    // Rank: matches where teams have better chances (smaller absolute gap to
    // their threshold) come first. Title-race ties break ahead of others.
    const stakeWeight = (s: StakeType[]): number =>
      s.includes("title") ? 0 : s.includes("relegation") ? 1 : 2;
    const chance = (m: Match): number => {
      const deltas: number[] = [];
      if (m.home.threshold) deltas.push(Math.abs(m.home.threshold.delta));
      if (m.away.threshold) deltas.push(Math.abs(m.away.threshold.delta));
      return deltas.length ? Math.min(...deltas) : 99;
    };
    matches.sort((a, b) => {
      const sw = stakeWeight(a.stakes) - stakeWeight(b.stakes);
      if (sw !== 0) return sw;
      return chance(a) - chance(b);
    });

    return { matches, error: null as string | null, budget: getQueue().dayCount };
  });
