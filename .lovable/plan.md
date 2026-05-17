## Goal

Show only **in-play matches past the 65th minute** (the betting-relevant window), and use that constraint to slash API usage so we never hit the throttle.

## Why this saves requests

Today we loop 25 leagues × 2 endpoints (standings + fixtures) = ~50 calls per cold load. The API-Football `/fixtures?live=all` endpoint returns **every live match in the world in a single call**. Filtering client-side to `minute >= 65` means most polls cost just 1 request, and we only pull standings for the handful of leagues that actually have a qualifying live match.

## Approach

Rewrite `src/lib/football.functions.ts` around a live-first strategy:

1. **One call for live data**: `GET /fixtures?live=all` → returns all in-play fixtures across all leagues. Filter to `fixture.status.elapsed >= 65` and `status.short in ['2H','ET','BT','P','LIVE']` (exclude HT and finished).
2. **Filter by configured leagues**: keep only fixtures whose `league.id` is in our `LEAGUE_MAP` (the 25 leagues we support).
3. **Lazy standings**: for each league that has ≥1 qualifying live match, fetch its standings (cached 12h per league as today). Leagues with no qualifying live matches cost 0 extra calls.
4. **Short cache for the live call**: 60s server-side cache on `/fixtures?live=all` (a match's minute only advances every minute anyway). Client `staleTime` stays at 60s.
5. **Hard request budget**: keep the existing throttle queue, but tighten daily budget tracking — abort early if today's used calls > 90.

## Request math

- Worst case during peak European Saturday (say 10 leagues with qualifying matches): 1 (live) + 10 (standings, cached 12h) = 11 calls, then 1 call/min for live refresh.
- Off-peak: 1 call/min, standings already cached.
- Daily ceiling with 60s polling for 8 active hours = ~480 polls → **way over 100/day**.

**Adjustment**: bump the live-fixtures cache to **5 minutes** server-side (minute precision is fine for "is this past 65'?"). That's ~12 calls/hour × ~8 active hours = ~96 calls + standings = still tight. So:
- Live endpoint cached **5 min** server-side.
- Manual "Refresh" button bypasses cache (capped to once per 30s client-side).
- Standings cached **24h** (positions change rarely mid-day).

## UI changes

- `src/routes/index.tsx`: empty state copy → "No matches currently past the 65th minute. Check back closer to full-time."
- Drop the league-by-league fallback to mock data (mock matches don't have a live minute, so they'd never qualify). Show only real qualifying live matches; if none, show empty state.
- Keep the Refresh button; rate-limit it to one click per 30s.

## Out of scope

- No schema changes to `Match`.
- No changes to standings rendering, stake computation, or card UI.
- Mock data file stays for design-time use but isn't merged into the live list anymore.

## Technical notes

- API-Football live status codes treated as "in play": `1H, HT, 2H, ET, BT, P, LIVE`. We filter to `elapsed >= 65` AND `short != 'HT'`.
- `elapsed` from the API is the displayed minute (includes injury time as 45+x / 90+x via `extra`).
- Throttle queue + 429 cooldown stay in place as a safety net.
