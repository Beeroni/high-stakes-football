## Goal

Swap the live data source from RapidAPI's API-Football to direct `api.sofascore.com` endpoints, and cut request volume by skipping any league that (a) has no fixture scheduled today, AND (b) is not in its final stretch of the season.

## What changes

### 1. New SofaScore client (`src/lib/football.functions.ts`, full rewrite of the fetch layer)

- Drop `RAPIDAPI_FOOTBALL_KEY` and all `api-football-v1.p.rapidapi.com` calls.
- New base: `https://api.sofascore.com/api/v1/...` with browser-like headers (`User-Agent`, `Accept: application/json`, `Origin: https://www.sofascore.com`, `Referer: https://www.sofascore.com/`) — required or Cloudflare returns 403.
- Keep the existing throttled queue (`MIN_GAP_MS`, `COOLDOWN_MS`, `DAILY_BUDGET`) and per-isolate cache, retuned for SofaScore's looser limits (raise `DAILY_BUDGET` to ~500, lower `MIN_GAP_MS` to ~2s). 429 → cooldown 60s, 403 → cooldown 24h with a clear "SofaScore is blocking this IP" error.
- Endpoints used:
  - `sport/football/scheduled-events/{YYYY-MM-DD}` — one call/day, cached 6h. Source of today's fixtures.
  - `unique-tournament/{id}/season/{seasonId}/events/last/0` and `.../events/next/0` — used once per league per day to determine total rounds + current round (drives "final stretch" detection). Cached 24h.
  - `unique-tournament/{id}/season/{seasonId}/standings/total` — standings table. Cached 24h.
  - `sport/football/events/live` — live fixtures, cached 5min, replaces `fixtures?live=all`.

### 2. League ID map

- Replace `API_LEAGUE` with `SOFA_LEAGUE`: `{ tournamentId, seasonId }` per internal league id. Populated once from SofaScore's `unique-tournament/{slug}` lookup (hardcoded based on current season, same approach we already use). Same 25 leagues.

### 3. "Final fixtures" gating (the request-saving rule)

A league is **eligible to poll** today only if EITHER:
- **Has a fixture today**: appears in today's `scheduled-events` payload, OR
- **In final stretch**: `currentRound >= totalRounds - 4` (last 5 matchdays).

Implementation:
- `getEligibleLeagues()` runs once per request, returns the intersection of user-selected leagues and the eligibility set.
- Live fixtures are filtered to eligible leagues only.
- Standings are fetched only for eligible leagues that also have a qualifying live match (already past 65').
- A league that fails the gate contributes zero API calls that day.

### 4. Live filter rules (unchanged)

- `minute >= 65`
- in-play statuses (`status.type === "inprogress"` + SofaScore's `status.code` in the 2H/ET set)
- league in eligible set

### 5. Match DTO + threshold logic

- Unchanged. `computeStakes`, `computeThreshold`, `buildLabel`, `buildExplainer` keep working — just fed from SofaScore standings rows (`team.id`, `position`, `points`, `pointsByRank`).

### 6. UI (`src/routes/index.tsx`, `src/components/MatchCard.tsx`)

- No visible changes. Error strings updated: "API-Football" → "SofaScore". The 403 hint changes to "SofaScore is blocking requests from this server — try again later".

### 7. Secrets

- No new secret required (direct SofaScore endpoints don't need a key).
- `RAPIDAPI_FOOTBALL_KEY` is left in place but unused; safe to delete from project secrets after this lands.

## Risk notes (plain)

- SofaScore has no public API and may block server IPs at any time. If 403s start happening from the Cloudflare Worker, the cooldown will kick in and the page will show the new "blocking" message; the fix at that point is either to use a proxy or move to a paid provider. I'll add a clear error so this is obvious instead of silent.
- The "final stretch" check needs `currentRound` + `totalRounds`. SofaScore provides both on each season object; if a league doesn't expose rounds (cup-style), it falls back to "must have fixture today" only.

## Out of scope

- No UI redesign.
- No changes to threshold math, refresh button behavior, or auto-refetch intervals.
- No new secrets, no Supabase changes.
