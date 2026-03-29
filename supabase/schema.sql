
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
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Umum',
  location   TEXT NOT NULL DEFAULT 'Lokal',
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

-- 5. Tabel: category_budgets
CREATE TABLE IF NOT EXISTS category_budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month_key     TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS category_budgets_unique
  ON category_budgets (user_id, category_id, month_key);

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
