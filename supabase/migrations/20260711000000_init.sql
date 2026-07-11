-- ============================================================
-- 數位牧民咖啡廳地圖 v2.2.1 — Database Schema
-- 對接 SPEC.md §4.3 + §6.2 DoD
-- 6 model + 2 enum + RLS policies
-- ============================================================

-- ----- Enums -----
DO $$ BEGIN
  CREATE TYPE timelimit AS ENUM ('UNLIMITED', 'ONE_HOUR', 'TWO_HOURS', 'THREE_HOURS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('FREE', 'PRO', 'BUSINESS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('spam', 'fake', 'off_topic', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----- Tables -----

CREATE TABLE IF NOT EXISTS cafes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  city          TEXT,
  country       TEXT,
  wifi_quality  INT NOT NULL DEFAULT 3 CHECK (wifi_quality BETWEEN 1 AND 5),
  power_outlets INT NOT NULL DEFAULT 2 CHECK (power_outlets BETWEEN 1 AND 3),
  quietness     INT NOT NULL DEFAULT 2 CHECK (quietness BETWEEN 1 AND 3),
  time_limit    timelimit NOT NULL DEFAULT 'UNLIMITED',
  seating       INT NOT NULL DEFAULT 3 CHECK (seating BETWEEN 1 AND 5),
  notes         TEXT,
  is_hidden     BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID,           -- 用 auth.users(id)，RLS 控制
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cafes_city ON cafes (city);
CREATE INDEX IF NOT EXISTS idx_cafes_country ON cafes (country);
CREATE INDEX IF NOT EXISTS idx_cafes_latlng ON cafes (lat, lng);

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id     UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     TEXT NOT NULL,
  photos      TEXT[] NOT NULL DEFAULT '{}',
  is_hidden   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- AC-005: 1 user 1 cafe 1 review（對應 SPEC §3.4 AC-005）
  CONSTRAINT reviews_user_cafe_unique UNIQUE (user_id, cafe_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_cafe ON reviews (cafe_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews (user_id);

CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id     UUID REFERENCES cafes(id) ON DELETE CASCADE,
  review_id   UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      report_reason NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reports_target_xor CHECK (
    (cafe_id IS NOT NULL AND review_id IS NULL) OR
    (cafe_id IS NULL AND review_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_reports_cafe ON reports (cafe_id);
CREATE INDEX IF NOT EXISTS idx_reports_review ON reports (review_id);

-- ----- User Profile (extends auth.users) -----
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  plan            plan NOT NULL DEFAULT 'FREE',
  stripe_customer_id TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_sub_id       TEXT UNIQUE NOT NULL,
  tier                plan NOT NULL DEFAULT 'FREE',
  status              TEXT NOT NULL DEFAULT 'active',
  current_period_end  TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- Favorites (我的最愛 v2 雲端同步) -----
CREATE TABLE IF NOT EXISTS favorites (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cafe_id    UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cafe_id)
);

-- ----- updated_at 自動觸發器 -----
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cafes_updated ON cafes;
CREATE TRIGGER tr_cafes_updated BEFORE UPDATE ON cafes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_reviews_updated ON reviews;
CREATE TRIGGER tr_reviews_updated BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_users_updated ON public.users;
CREATE TRIGGER tr_users_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS Policies (Supabase 強制 — §3.4 AC-005)
-- ============================================================

ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 任何人都能讀未隱藏的 cafe
DROP POLICY IF EXISTS cafes_read_all ON cafes;
CREATE POLICY cafes_read_all ON cafes
  FOR SELECT USING (is_hidden = false OR auth.uid() = created_by);

-- 登入使用者可以新增 cafe
DROP POLICY IF EXISTS cafes_insert_auth ON cafes;
CREATE POLICY cafes_insert_auth ON cafes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- 只有建立者可以改自己的 cafe
DROP POLICY IF EXISTS cafes_update_owner ON cafes;
CREATE POLICY cafes_update_owner ON cafes
  FOR UPDATE USING (auth.uid() = created_by);

-- 只有建立者可以刪除
DROP POLICY IF EXISTS cafes_delete_owner ON cafes;
CREATE POLICY cafes_delete_owner ON cafes
  FOR DELETE USING (auth.uid() = created_by);

-- 評論：任何人都能讀未隱藏的
DROP POLICY IF EXISTS reviews_read_all ON reviews;
CREATE POLICY reviews_read_all ON reviews
  FOR SELECT USING (is_hidden = false OR auth.uid() = user_id);

-- 評論：登入者可以新增自己寫的
DROP POLICY IF EXISTS reviews_insert_auth ON reviews;
CREATE POLICY reviews_insert_auth ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 評論：只有作者可以改
DROP POLICY IF EXISTS reviews_update_owner ON reviews;
CREATE POLICY reviews_update_owner ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS reviews_delete_owner ON reviews;
CREATE POLICY reviews_delete_owner ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 檢舉：登入者可新增
DROP POLICY IF EXISTS reports_insert_auth ON reports;
CREATE POLICY reports_insert_auth ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 檢舉：所有人不能讀（避免報復）
DROP POLICY IF EXISTS reports_no_read ON reports;
CREATE POLICY reports_no_read ON reports
  FOR SELECT USING (false);

-- User profile：只能讀/寫自己的
DROP POLICY IF EXISTS users_self_read ON public.users;
CREATE POLICY users_self_read ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS users_self_insert ON public.users;
CREATE POLICY users_self_insert ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions：只能讀自己的
DROP POLICY IF EXISTS subs_self_read ON subscriptions;
CREATE POLICY subs_self_read ON subscriptions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE id = subscriptions.user_id)
  );

-- Favorites：只能讀寫自己的
DROP POLICY IF EXISTS favs_self_read ON favorites;
CREATE POLICY favs_self_read ON favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS favs_self_write ON favorites;
CREATE POLICY favs_self_write ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Auto-create user profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 種子資料：10 家 sampleCafes 從 SPEC.md §4.3 v1 import
-- 對應 SPEC §3.1 F-002: 已預載 10 家亞太咖啡廳
-- ============================================================

INSERT INTO cafes (id, name, address, lat, lng, city, country, wifi_quality, power_outlets, quietness, time_limit, seating, notes, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Workation Space Bangkok', '123 Sukhumvit Road, Bangkok, Thailand', 13.7563, 100.5018, 'Bangkok', 'Thailand', 5, 3, 3, 'UNLIMITED', 5, 'Great co-working cafe with fast WiFi and plenty of outlets. Perfect for long work sessions.', now() - interval '5 days', now()),
  ('22222222-2222-2222-2222-222222222222', 'Digital Nomad Hub Bali', '456 Canggu Beach, Bali, Indonesia', -8.6478, 115.1385, 'Bali', 'Indonesia', 4, 2, 2, 'TWO_HOURS', 4, 'Beachside cafe with good vibes. Can get crowded on weekends.', now() - interval '3 days', now()),
  ('33333333-3333-3333-3333-333333333333', 'Taipei Remote Office', '78 Xinyi Road, Taipei, Taiwan', 25.0330, 121.5654, 'Taipei', 'Taiwan', 5, 3, 3, 'UNLIMITED', 5, 'Quiet neighborhood cafe with amazing Taiwanese tea and fast fiber internet.', now() - interval '1 days', now()),
  ('44444444-4444-4444-4444-444444444444', 'Starbucks Reserve Tokyo', '2-7-3 Marunouchi, Chiyoda City, Tokyo, Japan', 35.6812, 139.7671, 'Tokyo', 'Japan', 5, 3, 3, 'TWO_HOURS', 4, 'Premium Starbucks with excellent wifi and extremely quiet atmosphere.', now() - interval '4 days', now()),
  ('55555555-5555-5555-5555-555555555555', 'Blue Bottle Shibuya', '4-26-3 Shibuya, Shibuya City, Tokyo, Japan', 35.6617, 139.7047, 'Tokyo', 'Japan', 5, 2, 2, 'ONE_HOUR', 4, 'Minimalist design, great coffee, and reliable WiFi. Popular with remote workers.', now() - interval '2 days', now()),
  ('66666666-6666-6666-6666-666666666666', 'Paul Bassett Hongdae', '364-2 Seogyo-dong, Mapo-gu, Seoul, South Korea', 37.5568, 126.9231, 'Seoul', 'South Korea', 4, 3, 2, 'TWO_HOURS', 5, 'Korean specialty coffee chain with spacious seating.', now() - interval '6 days', now()),
  ('77777777-7777-7777-7777-777777777777', 'Coffee Bean MRT SS3', 'Amber at MRT SS3, Petaling Jaya, Malaysia', 3.0764, 101.5178, 'Kuala Lumpur', 'Malaysia', 4, 3, 3, 'UNLIMITED', 5, 'Air-conditioned, reliable WiFi, plenty of power outlets near MRT.', now() - interval '7 days', now()),
  ('88888888-8888-8888-8888-888888888888', 'Starbucks Central World', 'Central World Plaza, Bangkok, Thailand', 13.7468, 100.5398, 'Bangkok', 'Thailand', 4, 2, 1, 'ONE_HOUR', 3, 'Large flagship store, gets busy, has dedicated work area upstairs.', now() - interval '8 days', now()),
  ('99999999-9999-9999-9999-999999999999', 'Gong Cha Urban Cafe', '2F No. 1 Songzhi Road, Taipei, Taiwan', 25.0418, 121.5625, 'Taipei', 'Taiwan', 5, 3, 2, 'UNLIMITED', 5, 'Bubble tea meets co-working space. Free WiFi with QR code.', now() - interval '9 days', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Glitch Coffee Koishi', '3-13-7 Ginza, Chuo City, Tokyo, Japan', 35.6714, 139.7649, 'Tokyo', 'Japan', 3, 1, 3, 'ONE_HOUR', 3, 'Specialty coffee roaster with a quiet, focused atmosphere.', now() - interval '10 days', now())
ON CONFLICT (id) DO NOTHING;

-- 同步 sequence（如有）
SELECT setval(pg_get_serial_sequence('cafes', 'id'), 100, false);
