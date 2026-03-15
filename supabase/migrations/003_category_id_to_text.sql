-- Fix: category_id is UUID but the app sends string IDs like "salary", "groceries"
-- Change column from UUID (FK) to TEXT so it accepts the hardcoded category strings

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;

ALTER TABLE transactions
  ALTER COLUMN category_id TYPE TEXT USING category_id::TEXT;
