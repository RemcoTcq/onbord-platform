
-- =========================================
-- 1. CANDIDATES
-- =========================================
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  cv_storage_path TEXT NOT NULL DEFAULT '',
  cv_text TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'csv_import',
  status TEXT NOT NULL DEFAULT 'imported',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_request_id ON public.candidates(request_id);
CREATE INDEX idx_candidates_status ON public.candidates(status);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their candidates"
ON public.candidates FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = candidates.request_id AND r.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = candidates.request_id AND r.user_id = auth.uid()));

CREATE POLICY "Admins manage all candidates"
ON public.candidates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 2. REQUEST SCORING CONFIG
-- =========================================
CREATE TABLE public.request_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE,
  cv_weight NUMERIC NOT NULL DEFAULT 0.6,
  interview_weight NUMERIC NOT NULL DEFAULT 0.4,
  green_threshold INTEGER NOT NULL DEFAULT 80,
  yellow_threshold INTEGER NOT NULL DEFAULT 60,
  cv_criteria JSONB NOT NULL DEFAULT '{
    "must_have_skills": 30,
    "nice_to_have_skills": 15,
    "soft_skills": 15,
    "experience_years": 15,
    "diploma": 10,
    "languages": 15
  }'::jsonb,
  interview_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  use_ai_generated_questions BOOLEAN NOT NULL DEFAULT true,
  interview_max_turns INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weights_sum_to_one CHECK (cv_weight + interview_weight BETWEEN 0.99 AND 1.01),
  CONSTRAINT thresholds_valid CHECK (green_threshold > yellow_threshold AND green_threshold <= 100 AND yellow_threshold >= 0)
);

ALTER TABLE public.request_scoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their scoring config"
ON public.request_scoring_config FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_scoring_config.request_id AND r.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_scoring_config.request_id AND r.user_id = auth.uid()));

CREATE POLICY "Admins manage all scoring configs"
ON public.request_scoring_config FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_scoring_config_updated_at
BEFORE UPDATE ON public.request_scoring_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger : crée auto une config par défaut à chaque nouvelle demande
CREATE OR REPLACE FUNCTION public.create_default_scoring_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.request_scoring_config (request_id) VALUES (NEW.id)
  ON CONFLICT (request_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_scoring_config_on_request
AFTER INSERT ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.create_default_scoring_config();

-- Backfill pour les demandes existantes
INSERT INTO public.request_scoring_config (request_id)
SELECT id FROM public.requests
ON CONFLICT (request_id) DO NOTHING;

-- =========================================
-- 3. CANDIDATE SCORES
-- =========================================
CREATE TABLE public.candidate_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL UNIQUE,
  cv_score INTEGER,
  cv_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  interview_score INTEGER,
  interview_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  global_score INTEGER,
  flag TEXT,
  ai_summary TEXT NOT NULL DEFAULT '',
  ai_strengths TEXT[] NOT NULL DEFAULT '{}',
  ai_concerns TEXT[] NOT NULL DEFAULT '{}',
  scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidate_scores_candidate_id ON public.candidate_scores(candidate_id);
CREATE INDEX idx_candidate_scores_global_score ON public.candidate_scores(global_score DESC);

ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their candidate scores"
ON public.candidate_scores FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.candidates c
  JOIN public.requests r ON r.id = c.request_id
  WHERE c.id = candidate_scores.candidate_id AND r.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.candidates c
  JOIN public.requests r ON r.id = c.request_id
  WHERE c.id = candidate_scores.candidate_id AND r.user_id = auth.uid()
));

CREATE POLICY "Admins manage all candidate scores"
ON public.candidate_scores FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_candidate_scores_updated_at
BEFORE UPDATE ON public.candidate_scores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 4. INTERVIEW SESSIONS
-- =========================================
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_sessions_candidate_id ON public.interview_sessions(candidate_id);
CREATE INDEX idx_interview_sessions_token ON public.interview_sessions(token);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their interview sessions"
ON public.interview_sessions FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.candidates c
  JOIN public.requests r ON r.id = c.request_id
  WHERE c.id = interview_sessions.candidate_id AND r.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.candidates c
  JOIN public.requests r ON r.id = c.request_id
  WHERE c.id = interview_sessions.candidate_id AND r.user_id = auth.uid()
));

CREATE POLICY "Admins manage all interview sessions"
ON public.interview_sessions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_interview_sessions_updated_at
BEFORE UPDATE ON public.interview_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 5. INTERVIEW MESSAGES
-- =========================================
CREATE TABLE public.interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('assistant', 'candidate', 'system'))
);

CREATE INDEX idx_interview_messages_session_id ON public.interview_messages(session_id, created_at);

ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their interview messages"
ON public.interview_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.interview_sessions s
  JOIN public.candidates c ON c.id = s.candidate_id
  JOIN public.requests r ON r.id = c.request_id
  WHERE s.id = interview_messages.session_id AND r.user_id = auth.uid()
));

CREATE POLICY "Admins manage all interview messages"
ON public.interview_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 6. STORAGE BUCKET FOR CVs
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Owners (recruteurs) peuvent uploader/lire/supprimer les CV de leurs demandes
-- Path attendu : {request_id}/{candidate_id}/{filename}
CREATE POLICY "Owners can upload CVs to their requests"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cvs'
  AND EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id::text = (storage.foldername(name))[1]
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can read CVs from their requests"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'cvs'
  AND EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id::text = (storage.foldername(name))[1]
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete CVs from their requests"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'cvs'
  AND EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id::text = (storage.foldername(name))[1]
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all CVs"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'cvs' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'cvs' AND public.has_role(auth.uid(), 'admin'));
