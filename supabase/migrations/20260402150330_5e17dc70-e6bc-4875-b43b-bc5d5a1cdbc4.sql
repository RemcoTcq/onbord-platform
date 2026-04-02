
ALTER TABLE public.profiles
ADD COLUMN vat_number text NOT NULL DEFAULT '',
ADD COLUMN street_address text NOT NULL DEFAULT '',
ADD COLUMN postal_code text NOT NULL DEFAULT '',
ADD COLUMN city text NOT NULL DEFAULT '',
ADD COLUMN country text NOT NULL DEFAULT 'Belgique',
ADD COLUMN phone text NOT NULL DEFAULT '';
