
-- Add enriched profile columns
ALTER TABLE public.proposed_profiles
  ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_initial text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS validated_by_onbord boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS school text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS diploma text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS study_year text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS study_field text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hard_skills_detail jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS soft_skills_detail jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS looking_for jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_regime text NOT NULL DEFAULT '';

-- Recreate public view with new fields
DROP VIEW IF EXISTS public.proposed_profiles_public;
CREATE VIEW public.proposed_profiles_public
WITH (security_invoker = on) AS
SELECT
  pp.id,
  pp.request_id,
  pp.alias,
  pp.first_name,
  pp.last_initial,
  pp.bio,
  pp.validated_by_onbord,
  pp.headline,
  pp.summary,
  pp.experience_years,
  pp.skills,
  pp.hard_skills_detail,
  pp.soft_skills_detail,
  pp.languages,
  pp.school,
  pp.diploma,
  pp.study_year,
  pp.study_field,
  pp.experiences,
  pp.looking_for,
  pp.availability,
  pp.availability_regime,
  pp.location_area,
  pp.status,
  pp.rejection_reasons,
  pp.rejection_other,
  pp.created_at,
  pp.updated_at,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role) THEN pp.full_name ELSE NULL END AS full_name,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role) THEN pp.email ELSE NULL END AS email,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role) THEN pp.phone ELSE NULL END AS phone,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role) THEN pp.linkedin_url ELSE NULL END AS linkedin_url
FROM public.proposed_profiles pp
JOIN public.requests r ON r.id = pp.request_id;

-- Fix RLS to let companies transition through their own action statuses
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests"
ON public.requests
FOR UPDATE
TO authenticated
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  (
    user_id = auth.uid()
    AND status = ANY (ARRAY[
      'draft'::text,
      'Demande validée'::text,
      'Profils en cours de sélection'::text,
      'Profils validés'::text,
      'Entretien en cours d''organisation'::text
    ])
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
