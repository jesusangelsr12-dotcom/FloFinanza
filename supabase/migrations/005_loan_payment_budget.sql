-- Add budget_id to loan_payments so payments can flow into a cajita
ALTER TABLE loan_payments
  ADD COLUMN budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;
