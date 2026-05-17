## Plan

1. Add exact threshold data to each live match
   - Extend the match DTO with a small `thresholds` section for each team.
   - Compute points gaps from the fetched standings:
     - Relegation: gap to safety / cushion above danger.
     - Europe: gap to the configured continental cutoff.
     - Title: gap to 1st / lead over 2nd when relevant.
   - Keep the existing stake labels, but make the explainer more precise using these gaps.

2. Show the threshold in the match card mini-table
   - Under each team’s position/points line, add a compact line such as `+2 above safety`, `-3 from Europe`, or `+1 UCL cushion`.
   - Only show it when standings are available; otherwise avoid fake `0 pts` threshold text.
   - Keep the card layout responsive and avoid adding another API call.

3. Fix refresh button behavior so it does not keep spinning or hammer the API
   - Stop showing spinner for background polling unless a real request is actively in flight.
   - Make manual refresh use `refetch()` instead of invalidating broad queries.
   - Disable manual refresh for 30 seconds after a click and show a clear cooldown label instead of spinning indefinitely.
   - Disable automatic retry on API errors so 403/429 failures do not repeatedly retry and burn quota.

4. Make 403 Forbidden safe and understandable
   - Treat 403 as a hard configuration/quota/auth error, not a retryable live-data miss.
   - Return a user-friendly message explaining the RapidAPI Football key/plan needs checking.
   - Pause further automatic refetching while that 403 error is present, preventing more requests until the user manually tries again after fixing the key/plan.

## Technical notes

- No new endpoint calls are needed for the mini-table: standings are already fetched only for leagues with qualifying live matches.
- The current spinner is tied to React Query `isFetching`, so it can spin during automatic refetches and repeated error attempts. The fix separates manual refresh UI from background fetch state and turns off retries.
- The current `API-Football 403 Forbidden` means the RapidAPI subscription/key/endpoint access is being rejected. Code can prevent repeated calls and show a clearer message, but the key or RapidAPI plan still needs to be valid for real data to load.