GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
GRANT ALL ON public.frames TO service_role;
GRANT ALL ON public.players TO service_role;