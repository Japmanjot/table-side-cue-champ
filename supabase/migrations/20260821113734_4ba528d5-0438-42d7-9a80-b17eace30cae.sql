CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('standard','race')),
  target_score INTEGER,
  best_of INTEGER NOT NULL DEFAULT 1,
  player1_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player1_frames INTEGER NOT NULL DEFAULT 0,
  player2_frames INTEGER NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL DEFAULT 1,
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  player1_high_break INTEGER NOT NULL DEFAULT 0,
  player2_high_break INTEGER NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_created_at ON public.matches (created_at DESC);
CREATE INDEX idx_frames_match ON public.frames (match_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO anon, authenticated;
GRANT ALL ON public.frames TO service_role;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open access to players" ON public.players FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Open access to matches" ON public.matches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Open access to frames" ON public.frames FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.players (name) VALUES ('Japmanjot'), ('Dad'), ('Brother');