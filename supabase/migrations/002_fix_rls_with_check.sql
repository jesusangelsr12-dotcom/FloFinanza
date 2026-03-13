-- Fix RLS policies: add explicit WITH CHECK for INSERT operations.
-- The original FOR ALL USING(...) policy may silently block inserts
-- in some Supabase versions when WITH CHECK is not explicit.

DROP POLICY IF EXISTS "users_own_data" ON user_settings;
CREATE POLICY "users_own_data" ON user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON category_groups;
CREATE POLICY "users_own_data" ON category_groups
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON categories;
CREATE POLICY "users_own_data" ON categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON budgets;
CREATE POLICY "users_own_data" ON budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON budget_movements;
CREATE POLICY "users_own_data" ON budget_movements
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON transactions;
CREATE POLICY "users_own_data" ON transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON contacts;
CREATE POLICY "users_own_data" ON contacts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON transaction_splits;
CREATE POLICY "users_own_data" ON transaction_splits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON credit_cards;
CREATE POLICY "users_own_data" ON credit_cards
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON installment_plans;
CREATE POLICY "users_own_data" ON installment_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON installment_payments;
CREATE POLICY "users_own_data" ON installment_payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON loans;
CREATE POLICY "users_own_data" ON loans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_data" ON loan_payments;
CREATE POLICY "users_own_data" ON loan_payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
