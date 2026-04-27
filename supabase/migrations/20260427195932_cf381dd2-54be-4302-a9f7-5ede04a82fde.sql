ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS work_location text NOT NULL DEFAULT '';