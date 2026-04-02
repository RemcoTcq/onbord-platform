
ALTER TABLE public.requests 
  ADD COLUMN nice_to_have_skills text[] DEFAULT '{}'::text[],
  ADD COLUMN nice_to_have_soft_skills text[] DEFAULT '{}'::text[];
