-- ============================================
-- Budgetin — Supabase Schema
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Tabel: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  theme      TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabel: categories
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'MISC',
  color      TEXT NOT NULL DEFAULT '#64748b',
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabel: transactions
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Seed: default categories
-- ============================================
INSERT INTO categories (id, name, icon, color, type, is_default) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Makanan',       'FOOD', '#f97316', 'expense', true),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Transportasi',  'MOVE', '#06b6d4', 'expense', true),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Tagihan',       'BILL', '#f43f5e', 'expense', true),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Gaji',          'PAY',  '#22c55e', 'income',  true),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Bonus',         'PLUS', '#6366f1', 'income',  true)
ON CONFLICT (id) DO NOTHING;

-- Seed: default profile (single-user untuk sementara)
INSERT INTO profiles (id, name, email, theme) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Rafi Budgetin', 'rafi@budgetin.id', 'dark')
ON CONFLICT (id) DO NOTHING;
