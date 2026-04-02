
-- Validation trigger for status field on requests table
CREATE OR REPLACE FUNCTION public.validate_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'Demande validée', 'Recherche des profils', 'Présentation des profils', 'Profils validés', 'Mission lancée') THEN
    RAISE EXCEPTION 'Invalid status value: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_request_status_trigger
BEFORE INSERT OR UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_request_status();

-- Tighten INSERT policy: users can only create drafts or validated requests
DROP POLICY IF EXISTS "Users can create own requests" ON public.requests;
CREATE POLICY "Users can create own requests"
ON public.requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND status IN ('draft', 'Demande validée'));

-- Tighten UPDATE policy: users can only update their own requests but cannot change status freely; admins can do anything
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests"
ON public.requests
FOR UPDATE
TO authenticated
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  (user_id = auth.uid() AND status IN ('draft', 'Demande validée'))
  OR has_role(auth.uid(), 'admin'::app_role)
);
