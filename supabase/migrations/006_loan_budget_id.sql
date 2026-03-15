-- Store which cajita a loan is linked to, so movements can be reversed on deletion
ALTER TABLE loans
  ADD COLUMN budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;
