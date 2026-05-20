
CREATE TABLE public.fixtures_cache (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_short TEXT NOT NULL,
  away_short TEXT NOT NULL,
  home_position INT,
  away_position INT,
  home_points INT,
  away_points INT,
  home_color TEXT,
  away_color TEXT,
  kickoff_utc TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  stakes TEXT[] NOT NULL DEFAULT '{}',
  stakes_label TEXT NOT NULL DEFAULT '',
  stakes_explainer TEXT NOT NULL DEFAULT '',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fixtures_kickoff ON public.fixtures_cache(kickoff_utc);
CREATE INDEX idx_fixtures_league ON public.fixtures_cache(league_id);

CREATE TABLE public.standings_cache (
  league_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  position INT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  played INT NOT NULL DEFAULT 0,
  team_color TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (league_id, team_name)
);

CREATE INDEX idx_standings_league ON public.standings_cache(league_id);

ALTER TABLE public.fixtures_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read fixtures" ON public.fixtures_cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can read standings" ON public.standings_cache FOR SELECT TO anon, authenticated USING (true);
