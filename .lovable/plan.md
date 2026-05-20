## Goal

Replace static mock fixtures with real data from TheSportsDB, cached daily in Lovable Cloud, and surface the 5 soonest upcoming games across the user's selected leagues.

## Approach

### 1. Enable Lovable Cloud
Needed to store cached fixtures/standings in Postgres and run a daily cron job. TheSportsDB's free tier has no key requirement for basic endpoints, but we still want a backend for caching.

### 2. Database schema (migration)
- `leagues_cache` — `id` (our internal league id), `sportsdb_id`, `name`, `last_synced_at`
- `fixtures_cache` — `id` (sportsdb event id), `league_id`, `home_team`, `away_team`, `home_position`, `away_position`, `kickoff_utc`, `status`, `stakes` (text[]), `stakes_label`, `stakes_explainer`, `synced_at`
- `standings_cache` — `league_id`, `team_name`, `position`, `points`, `played`, `synced_at` (composite PK)
- RLS: public SELECT on all three (read-only public data); writes restricted to service role only.

### 3. League ID mapping
Add `sportsdbId` to each entry in `src/data/leagues.ts` so we know which TheSportsDB league to query (e.g. Premier League = 4328).

### 4. Sync logic
- `src/lib/sync.server.ts` — fetches next-15-days fixtures + current standings from TheSportsDB for each of the 25 leagues, computes stakes (relegation/title/continental) by comparing team table position to league-specific thresholds, and upserts into cache tables using `supabaseAdmin`.
- Stakes inference rules per league config: bottom 3 → relegation; top 2 → title; positions 3–6 → continental (tuned per league size).

### 5. Public cron endpoint
- `src/routes/api/public/sync-fixtures.ts` — POST handler, header-token auth (`SYNC_SECRET`), calls the sync function. Triggered daily via pg_cron hitting the stable `project--{id}.lovable.app` URL.

### 6. Read path (server functions)
- `src/lib/fixtures.functions.ts` — `getUpcomingFixtures({ leagueIds })` queries `fixtures_cache` for kickoffs ≥ now, ordered ascending, **LIMIT 5**.
- `src/routes/index.tsx` — replace `MATCHES` static import with `useQuery` calling the server fn; keep existing filter/sidebar UI; show skeleton while loading.

### 7. Rate-limit safety
- 5-game LIMIT applied at the SQL query, not client-side, so we never render more.
- Sync runs **once per day** via cron, not per-request. TheSportsDB free tier is ~30 req/min; 25 leagues × 2 calls = 50 requests, well under limits even if run manually.
- Frontend reads only from cache — zero TheSportsDB calls on user traffic.

## Out of scope
- No live in-play updates (would need websockets / paid tier).
- No historical results browsing.
- Auth, payments, other features unchanged.

## Technical notes
- TheSportsDB endpoints used: `/api/v1/json/3/eventsnextleague.php?id={leagueId}` and `/api/v1/json/3/lookuptable.php?l={leagueId}&s={season}`.
- Secret added: `SYNC_SECRET` (random token for cron auth).
- After deploy, user manually triggers first sync via the endpoint to populate cache, then pg_cron takes over.
