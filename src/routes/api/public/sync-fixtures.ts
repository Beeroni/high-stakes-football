import { createFileRoute } from "@tanstack/react-router";
import { syncAllLeagues } from "@/lib/sync.server";

export const Route = createFileRoute("/api/public/sync-fixtures")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate via Supabase anon key in the apikey header (matches pg_cron convention).
        const provided = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const results = await syncAllLeagues();
          const totals = results.reduce(
            (acc, r) => ({ fixtures: acc.fixtures + r.fixtures, standings: acc.standings + r.standings }),
            { fixtures: 0, standings: 0 },
          );
          return new Response(JSON.stringify({ ok: true, totals, leagues: results }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[sync] failed", e);
          return new Response(JSON.stringify({ ok: false, error: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      GET: async () =>
        new Response(JSON.stringify({ hint: "POST with Supabase anon key in 'apikey' header to trigger sync." }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
