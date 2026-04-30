ALTER TABLE public.candidate_scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidate_scores;