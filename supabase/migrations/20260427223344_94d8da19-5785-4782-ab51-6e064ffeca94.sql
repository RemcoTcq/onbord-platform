-- 1. Update allowed statuses
CREATE OR REPLACE FUNCTION public.validate_request_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN (
    'draft',
    'Demande validée',
    'Profils en cours de sélection',
    'Profils envoyés',
    'Profils validés',
    'Entretien en cours d''organisation',
    'Recrutement finalisé',
    -- legacy values kept for backward compatibility
    'Recherche des profils',
    'Présentation des profils',
    'Mission lancée'
  ) THEN
    RAISE EXCEPTION 'Invalid status value: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. proposed_profiles
CREATE TABLE public.proposed_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  alias text NOT NULL DEFAULT 'Talent',
  headline text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  experience_years integer NOT NULL DEFAULT 0,
  skills text[] NOT NULL DEFAULT '{}',
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  availability text NOT NULL DEFAULT '',
  location_area text NOT NULL DEFAULT '',
  -- private (admin only)
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  rejection_reasons text[] NOT NULL DEFAULT '{}',
  rejection_other text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposed_profiles_status_check CHECK (status IN ('pending','accepted','rejected'))
);

CREATE INDEX idx_proposed_profiles_request ON public.proposed_profiles(request_id);

ALTER TABLE public.proposed_profiles ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins manage all profiles"
ON public.proposed_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Owner of the request: can SELECT
CREATE POLICY "Owners can view their proposed profiles"
ON public.proposed_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);

-- Owner can UPDATE only the status / rejection fields (controlled in app + RLS allows update on own rows)
CREATE POLICY "Owners can update profile status"
ON public.proposed_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);

-- 3. Public view (hides private fields unless the request is finalized)
CREATE OR REPLACE VIEW public.proposed_profiles_public
WITH (security_invoker = true)
AS
SELECT
  pp.id,
  pp.request_id,
  pp.alias,
  pp.headline,
  pp.summary,
  pp.experience_years,
  pp.skills,
  pp.languages,
  pp.availability,
  pp.location_area,
  pp.status,
  pp.rejection_reasons,
  pp.rejection_other,
  pp.created_at,
  pp.updated_at,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role)
       THEN pp.full_name ELSE NULL END AS full_name,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role)
       THEN pp.email ELSE NULL END AS email,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role)
       THEN pp.phone ELSE NULL END AS phone,
  CASE WHEN r.status = 'Recrutement finalisé' OR has_role(auth.uid(), 'admin'::app_role)
       THEN pp.linkedin_url ELSE NULL END AS linkedin_url
FROM public.proposed_profiles pp
JOIN public.requests r ON r.id = pp.request_id;

-- 4. interview_requests
CREATE TABLE public.interview_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_profile_id uuid NOT NULL REFERENCES public.proposed_profiles(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  mode text NOT NULL,
  proposed_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_slot jsonb,
  status text NOT NULL DEFAULT 'pending_admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interview_requests_mode_check CHECK (mode IN ('video','onsite')),
  CONSTRAINT interview_requests_status_check CHECK (status IN ('pending_admin','confirmed','cancelled'))
);

CREATE INDEX idx_interview_requests_request ON public.interview_requests(request_id);

ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage interviews"
ON public.interview_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners view their interviews"
ON public.interview_requests FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid()));

CREATE POLICY "Owners create their interviews"
ON public.interview_requests FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid()));

-- 5. admin_notifications
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_notifications_type_check CHECK (type IN ('profiles_rejected','profile_accepted','interview_slots_proposed'))
);

CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications(read, created_at DESC);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users (request owners) can insert notifications about their own requests
CREATE POLICY "Owners can create notifications for their requests"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (
  request_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);

-- 6. updated_at trigger function (reused)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_proposed_profiles_updated
BEFORE UPDATE ON public.proposed_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_interview_requests_updated
BEFORE UPDATE ON public.interview_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;