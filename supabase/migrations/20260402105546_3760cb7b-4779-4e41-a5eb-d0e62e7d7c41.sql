
CREATE POLICY "Users can delete own requests"
ON public.requests
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
