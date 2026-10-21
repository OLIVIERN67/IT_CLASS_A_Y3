-- Additive migration. It preserves every row in public.members and does not
-- create a second member directory.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.member_users (
  id bigserial PRIMARY KEY,
  member_id integer NOT NULL UNIQUE REFERENCES public.members(id) ON DELETE CASCADE,
  email text UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('CP', 'CEPINE', 'MEMBER')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_users
  ALTER COLUMN email DROP NOT NULL;

CREATE INDEX IF NOT EXISTS members_role_idx ON public.members ("Role");
CREATE INDEX IF NOT EXISTS members_updated_at_idx ON public.members (updated_at DESC);
CREATE INDEX IF NOT EXISTS member_users_member_id_idx ON public.member_users (member_id);

CREATE OR REPLACE FUNCTION public.set_member_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS members_updated_at_trigger ON public.members;
CREATE TRIGGER members_updated_at_trigger
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.set_member_updated_at();

DROP TRIGGER IF EXISTS member_users_updated_at_trigger ON public.member_users;
CREATE TRIGGER member_users_updated_at_trigger
BEFORE UPDATE ON public.member_users
FOR EACH ROW EXECUTE FUNCTION public.set_member_updated_at();
