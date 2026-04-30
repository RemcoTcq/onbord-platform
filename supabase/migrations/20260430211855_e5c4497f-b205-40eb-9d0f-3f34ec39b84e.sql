-- Ensure one score row per candidate (needed for upsert in score-cv)
ALTER TABLE public.candidate_scores
  ADD CONSTRAINT candidate_scores_candidate_id_unique UNIQUE (candidate_id);