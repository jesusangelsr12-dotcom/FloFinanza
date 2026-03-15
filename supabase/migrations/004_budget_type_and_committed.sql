-- Add type to budgets so income cajitas don't show over-budget alerts
ALTER TABLE budgets
  ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'expense'
    CHECK (type IN ('expense', 'income'));

-- Add committed amount for planned/future expenses
ALTER TABLE budgets
  ADD COLUMN committed DECIMAL(12,2) NOT NULL DEFAULT 0;
