
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own user role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'user');

-- Create requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  soft_skills TEXT[] DEFAULT '{}',
  custom_skills TEXT[] DEFAULT '{}',
  languages JSONB DEFAULT '[]',
  diploma TEXT,
  talents_number INTEGER NOT NULL DEFAULT 1,
  days_per_week INTEGER NOT NULL DEFAULT 1,
  schedule_type TEXT NOT NULL DEFAULT 'flexible',
  schedule_details JSONB DEFAULT '{}',
  work_mode TEXT NOT NULL DEFAULT 'remote',
  weekly_hours NUMERIC NOT NULL DEFAULT 0,
  weekly_price NUMERIC NOT NULL DEFAULT 0,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Demande validée',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- RLS for requests
CREATE POLICY "Users can view own requests"
  ON public.requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own requests"
  ON public.requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own requests"
  ON public.requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
