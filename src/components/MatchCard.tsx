import type { Match } from "@/data/matches";
import { LEAGUES } from "@/data/leagues";
import { StakeBadge } from "./StakeBadge";
import { TeamCrest } from "./TeamCrest";
import { Calendar, Radio } from "lucide-react";

export function MatchCard({ match }: { match: Match }) {
  const league = LEAGUES.find((l) => l.id === match.leagueId)!;
  const date = new Date(match.date);
  // Use fixed locale + UTC so SSR and client render identical strings (no hydration mismatch).
  const dateStr = date.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }) + " UTC";

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-[0_0_0_1px_var(--primary)]/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-base leading-none">{league.flag}</span>
          <span className="font-medium text-foreground/80">{league.name}</span>
          <span className="opacity-50">·</span>
          <span>{league.country}</span>
        </div>
        {match.status === "live" ? (
          <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
            <Radio className="h-3 w-3 animate-pulse" />
            Live · {match.liveMinute}'
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {dateStr} · {timeStr}
          </span>
        )}
      </div>

      {/* Stakes badges */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3">
        {match.stakes.map((s, i) => (
          <StakeBadge key={s} type={s} label={i === 0 ? match.stakesLabel : undefined} />
        ))}
      </div>

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4">
        <TeamRow team={match.home} align="left" />
        <div className="flex flex-col items-center">
          {match.status === "live" ? (
            <div className="font-display text-2xl font-bold tabular-nums">
              {match.homeScore} <span className="text-muted-foreground">–</span> {match.awayScore}
            </div>
          ) : (
            <div className="font-display text-lg font-semibold text-muted-foreground">vs</div>
          )}
        </div>
        <TeamRow team={match.away} align="right" />
      </div>

      {/* Stakes explainer */}
      <div className="border-t border-border/60 bg-background/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Why it matters: </span>
        {match.stakesExplainer}
      </div>
    </article>
  );
}

function TeamRow({ team, align }: { team: Match["home"]; align: "left" | "right" }) {
  const isRight = align === "right";
  return (
    <div className={`flex items-center gap-3 ${isRight ? "flex-row-reverse text-right" : ""}`}>
      <TeamCrest short={team.short} color={team.color} />
      <div className={isRight ? "items-end" : ""}>
        <div className="font-display text-base font-semibold leading-tight">{team.name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono tabular-nums">
            {ordinal(team.position)}
          </span>
          <span className="ml-1.5 opacity-70">{team.points} pts</span>
        </div>
      </div>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
