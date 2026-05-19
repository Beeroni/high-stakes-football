## Goal

Replace the current mock fixtures in `src/data/matches.ts` with a realistic, season run-in dataset for mid-May 2026 — the actual climax week for most top leagues — so every card reflects a plausible matchup with correct teams, league positions, and stakes.

## Approach

1. **Research current standings** (websearch) for each of the 25 leagues to pull near-final 2025-26 table positions for relegation zone, title race, and continental qualification spots. Sources: official league sites, ESPN, BBC, transfermarkt.
2. **Rewrite `src/data/matches.ts`** with ~32–40 matches dated within May 9–24, 2026, ensuring:
   - Real club names that actually play in each league this season (e.g. Leicester is in Championship 25-26, not PL).
   - League positions reflect the actual current table (within reason).
   - `stakesLabel` and `stakesExplainer` use accurate point gaps and consequences.
   - Every category (relegation / title-promotion / continental) is well-represented across Europe, Latin America, Asia.
   - Note: many Latin American leagues (Brasileirão, Liga MX Clausura) and Asian leagues (J1) are on different calendars — use fixtures appropriate to their May 2026 state (e.g. Brasileirão early-season, Liga MX Clausura playoffs, J1 mid-season ACL spots).
3. **Update `src/data/leagues.ts`** only if any team primary colors are missing for newly introduced clubs.
4. **Quiet fix**: the hydration mismatch on match times (server vs. client timezone formatting in `MatchCard.tsx`) — render times in a fixed timezone (UTC) or pre-format the string in the data layer so SSR and client agree.

## Out of scope

- No API integration, no schema changes, no UI/layout changes.
- Filtering, sidebar, and components remain untouched.

## Technical notes

- Keep the existing `Match` interface as-is so components don't need edits.
- For each league, include 1–2 matches; prioritize the leagues with the most dramatic late-season stakes (PL, La Liga, Serie A, Bundesliga, Ligue 1, Championship, Eredivisie, Primeira, Liga MX, Brasileirão, MLS, Saudi Pro, J1).
- Time fix: format `match.date` with `toLocaleTimeString('en-US', { timeZone: 'UTC', ... })` so SSR (UTC) matches client.
