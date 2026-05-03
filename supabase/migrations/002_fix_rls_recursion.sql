-- Fix: Drop the recursive "Admin can read all profiles" policy
-- and replace with a SECURITY DEFINER function that avoids recursion

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;

-- 2. Create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Recreate the admin policy using the helper function
CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());
