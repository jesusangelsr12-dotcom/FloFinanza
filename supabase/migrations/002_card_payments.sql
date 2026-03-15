-- =============================================
-- CARD PAYMENTS (per billing period)
-- =============================================

CREATE TABLE card_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE card_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON card_payments FOR ALL USING (auth.uid() = user_id);
