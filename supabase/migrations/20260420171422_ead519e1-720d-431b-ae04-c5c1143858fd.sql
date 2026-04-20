ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS natural_language_query text,
ADD COLUMN IF NOT EXISTS employment_type text;