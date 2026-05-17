import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LEAGUES } from "@/data/leagues";
import { type Match } from "@/data/matches";
import { LeagueSidebar } from "@/components/LeagueSidebar";
import { StakeFilter, type StakeFilterValue } from "@/components/StakeFilter";
import { MatchCard } from "@/components/MatchCard";
import { getLiveMatches } from "@/lib/football.functions";
import { Flame, Search, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StakesFC — High-Stakes Football Matches, Aggregated" },
      {
        name: "description",
        content:
          "Track relegation battles, title races, and Champions League spot deciders across 25 leagues in Europe, Latin America, and Asia.",
      },
      { property: "og:title", content: "StakesFC — Where the Stakes Are" },
      {
        property: "og:description",
        content: "The only football feed that filters by what's actually on the line.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [selectedLeagues, setSelectedLeagues] = useState<Set<string>>(
    () => new Set(LEAGUES.map((l) => l.id)),
  );
  const [stakeFilter, setStakeFilter] = useState<StakeFilterValue>("all");
  const [query, setQuery] = useState("");

  const toggleLeague = (id: string) => {
    setSelectedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const leagueIdsKey = useMemo(
    () => [...selectedLeagues].sort().join(","),
    [selectedLeagues],
  );

  const fetchLive = useServerFn(getLiveMatches);
  const [refreshCooldownUntil, setRefreshCooldownUntil] = useState(0);
  const liveQuery = useQuery({
    queryKey: ["live-matches", leagueIdsKey],
    queryFn: () => fetchLive({ data: { leagueIds: leagueIdsKey.split(",").filter(Boolean) } }),
    enabled: leagueIdsKey.length > 0,
    staleTime: 5 * 60 * 1000,
    // Pause auto-refetch when the server returned an error payload (e.g. 403/quota).
    refetchInterval: (q) => {
      const d = q.state.data as { error?: string | null } | undefined;
      return d?.error ? false : 5 * 60 * 1000;
    },
    refetchOnWindowFocus: false,
    retry: false, // never auto-retry — burns API quota
  });

  const apiError = liveQuery.data?.error ?? (liveQuery.error instanceof Error ? liveQuery.error.message : null);
  const now = Date.now();
  const cooldownRemaining = Math.max(0, Math.ceil((refreshCooldownUntil - now) / 1000));
  const refreshDisabled = liveQuery.isFetching || cooldownRemaining > 0;

  const handleRefresh = () => {
    if (refreshDisabled) return;
    setRefreshCooldownUntil(Date.now() + 30_000);
    liveQuery.refetch();
  };

  const byLeague = useMemo<Match[]>(() => {
    return liveQuery.data?.matches ?? [];
  }, [liveQuery.data]);

  const counts = useMemo(() => {
    const c = { all: byLeague.length, relegation: 0, title: 0, continental: 0 };
    for (const m of byLeague) {
      for (const s of m.stakes) c[s]++;
    }
    return c as Record<StakeFilterValue, number>;
  }, [byLeague]);

  const filtered = useMemo(() => {
    let list = byLeague;
    if (stakeFilter !== "all") list = list.filter((m) => m.stakes.includes(stakeFilter));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.home.name.toLowerCase().includes(q) ||
          m.away.name.toLowerCase().includes(q) ||
          m.stakesLabel.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "live" ? -1 : 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [byLeague, stakeFilter, query]);

  const liveCount = filtered.filter((m) => m.status === "live").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-20 h-16 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex h-full items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-none tracking-tight">
                Stakes<span className="text-primary">FC</span>
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Only the matches that matter
              </p>
            </div>
          </div>

          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams or stakes…"
              className="w-full rounded-lg border border-border bg-input/60 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleRefresh}
              disabled={liveQuery.isFetching}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              <RefreshCw className={liveQuery.isFetching ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
              Refresh
            </button>
            {liveQuery.isFetching && (
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing
              </span>
            )}
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 font-bold uppercase tracking-wider text-destructive">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                {liveCount} Live
              </span>
            )}
            <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
              {filtered.length} matches
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        <LeagueSidebar
          selected={selectedLeagues}
          onToggle={toggleLeague}
          onSetAll={(ids) => setSelectedLeagues(new Set(ids))}
        />

        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">Match Feed</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter by what's on the line — relegation, the title, or a continental spot.
            </p>
          </div>

          <div className="mb-6">
            <StakeFilter value={stakeFilter} onChange={setStakeFilter} counts={counts} />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold">
                No matches currently past the 65th minute
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {liveQuery.isFetching
                  ? "Checking live fixtures…"
                  : liveQuery.data?.error
                    ? liveQuery.data.error
                    : "Check back closer to full-time for in-play matches with settled odds."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filtered.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
