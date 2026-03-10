-- Income distribution rules
-- Allows users to define how income is automatically distributed to cajitas (budgets)

CREATE TABLE income_distribution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  allocation_type VARCHAR(10) NOT NULL CHECK (allocation_type IN ('percent', 'fixed')),
  allocation_value DECIMAL(12,2) NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE income_distribution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own distribution rules"
  ON income_distribution_rules FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_distribution_rules_user ON income_distribution_rules(user_id);
