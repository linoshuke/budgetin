-- ============================================
-- Budgetin - Supabase Schema
-- Jalankan script ini di Supabase Dashboard -> SQL Editor
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

-- 3. Tabel: wallets
CREATE TABLE IF NOT EXISTS wallets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabel: transactions
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  wallet_id   UUID REFERENCES wallets(id) ON DELETE SET NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade path untuk database lama yang belum punya kolom wallet_id
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS wallet_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_wallet_id_fkey'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_wallet_id_fkey
      FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- ============================================
-- Seed: default categories
-- ============================================
INSERT INTO categories (id, name, icon, color, type, is_default) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Makanan',      'FOOD', '#f97316', 'expense', true),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Transportasi', 'MOVE', '#06b6d4', 'expense', true),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Tagihan',      'BILL', '#f43f5e', 'expense', true),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Gaji',         'PAY',  '#22c55e', 'income',  true),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Bonus',        'PLUS', '#6366f1', 'income',  true)
ON CONFLICT (id) DO NOTHING;

-- Seed: default wallets
INSERT INTO wallets (id, name, is_default) VALUES
  ('b2c3d4e5-0001-4000-8000-000000000001', 'Tunai', true)
ON CONFLICT (id) DO NOTHING;

-- Seed: default profile (single-user sementara)
INSERT INTO profiles (id, name, email, theme) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Rafi Budgetin', 'rafi@budgetin.id', 'dark')
ON CONFLICT (id) DO NOTHING;

-- Isi wallet_id transaksi lama agar tetap terhubung ke dompet default
UPDATE transactions
SET wallet_id = 'b2c3d4e5-0001-4000-8000-000000000001'
WHERE wallet_id IS NULL;
