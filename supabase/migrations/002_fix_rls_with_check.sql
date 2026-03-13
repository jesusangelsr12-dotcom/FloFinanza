-- Fix RLS policies: add explicit WITH CHECK for INSERT operations.
-- The original FOR ALL USING(...) policy may silently block inserts
-- in some Supabase versions when WITH CHECK is not explicit.

DROP POLICY IF EXISTS "users_own_data" ON user_settings;
CREATE POLICY "users_own_data" ON user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
