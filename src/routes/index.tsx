import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LEAGUES } from "@/data/leagues";
import { getUpcomingFixtures, type FixtureDTO } from "@/lib/fixtures.functions";
import { LeagueSidebar } from "@/components/LeagueSidebar";
import { StakeFilter, type StakeFilterValue } from "@/components/StakeFilter";
import { MatchCard } from "@/components/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Search } from "lucide-react";
import type { Match } from "@/data/matches";

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

  const fetchFixtures = useServerFn(getUpcomingFixtures);
  const leagueIdsKey = useMemo(() => [...selectedLeagues].sort().join(","), [selectedLeagues]);

  const { data: fixtures = [], isLoading } = useQuery<FixtureDTO[]>({
    queryKey: ["fixtures", leagueIdsKey],
    queryFn: () => fetchFixtures({ data: { leagueIds: [...selectedLeagues] } }),
    staleTime: 5 * 60 * 1000,
  });

  const toggleLeague = (id: string) => {
    setSelectedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const counts = useMemo(() => {
    const c = { all: fixtures.length, relegation: 0, title: 0, continental: 0 };
    for (const m of fixtures) for (const s of m.stakes) c[s]++;
    return c as Record<StakeFilterValue, number>;
  }, [fixtures]);

  const filtered = useMemo(() => {
    let list = fixtures;
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
    return list;
  }, [fixtures, stakeFilter, query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
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
              <p className="text-[11px] text-muted-foreground">Only the matches that matter</p>
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
            {filtered.some((m) => m.status === "live") && (
              <span className="flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 font-bold uppercase tracking-wider text-destructive-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                {filtered.filter((m) => m.status === "live").length} Live
              </span>
            )}
            <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
              {filtered.filter((m) => m.status !== "live").length} / 5 upcoming
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
              The 5 soonest upcoming high-stakes games across your selected leagues. Refreshed daily.
            </p>
          </div>

          <div className="mb-6">
            <StakeFilter value={stakeFilter} onChange={setStakeFilter} counts={counts} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold">No fixtures yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The cache may still be warming up. Trigger a sync by POSTing to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/public/sync-fixtures</code>{" "}
                with your project apikey header, or wait for the daily cron.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filtered.some((m) => m.status === "live") && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-destructive">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                    Live Now
                  </h3>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filtered.filter((m) => m.status === "live").map((m) => (
                      <MatchCard key={m.id} match={m as unknown as Match} />
                    ))}
                  </div>
                </section>
              )}
              {filtered.some((m) => m.status !== "live") && (
                <section>
                  <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Next 5 Upcoming
                  </h3>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filtered.filter((m) => m.status !== "live").map((m) => (
                      <MatchCard key={m.id} match={m as unknown as Match} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
