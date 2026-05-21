ALTER TABLE public.fixtures_cache
  ADD COLUMN IF NOT EXISTS home_score integer,
  ADD COLUMN IF NOT EXISTS away_score integer,
  ADD COLUMN IF NOT EXISTS live_minute text,
  ADD COLUMN IF NOT EXISTS is_knockout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS round_label text;

CREATE INDEX IF NOT EXISTS fixtures_cache_status_kickoff_idx
  ON public.fixtures_cache (status, kickoff_utc);