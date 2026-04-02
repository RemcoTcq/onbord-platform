DROP POLICY "Users can delete own requests" ON public.requests;

CREATE POLICY "Users and admins can delete requests"
ON public.requests
FOR DELETE
TO authenticated
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));