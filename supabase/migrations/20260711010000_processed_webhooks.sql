-- ============================================================
-- Sprint 3: 加 processed_webhooks 表（Stripe webhook idempotency）
-- 對應 SPEC §3.4 AC-006
-- ============================================================

CREATE TABLE IF NOT EXISTS processed_webhooks (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_type ON processed_webhooks (event_type);

-- 不開 RLS（service_role 全用；沒有人直接讀）

-- ============================================================
-- Sprint 3: 加 favorites 表的 RLS 補完（favs_self_read 已有但可能漏）
-- ============================================================

-- 確保 favorites 表 RLS 全套齊
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favs_self_read ON favorites;
CREATE POLICY favs_self_read ON favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS favs_self_write ON favorites;
CREATE POLICY favs_self_write ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Sprint 3: 加 plan 變動時間索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users (plan);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users (stripe_customer_id);
