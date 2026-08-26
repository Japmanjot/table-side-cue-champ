ALTER TABLE public.matches
  ADD COLUMN player3_id uuid REFERENCES public.players(id),
  ADD COLUMN player3_frames integer NOT NULL DEFAULT 0;

ALTER TABLE public.frames
  ADD COLUMN player3_score integer NOT NULL DEFAULT 0,
  ADD COLUMN player3_high_break integer NOT NULL DEFAULT 0;