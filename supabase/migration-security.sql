-- ============================================
-- Budgetin — Security Migration
-- Jalankan script ini di Supabase Dashboard -> SQL Editor
-- SETELAH deploy code baru
-- ============================================

-- ─── 1. Tambah kolom user_id ke tabel-tabel utama ─────────

-- Categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Wallets
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─── 2. Bersihkan data seed lama yang tidak terhubung ke auth.users ──

-- Hapus transaksi yang tidak punya user_id (data lama)
DELETE FROM transactions WHERE user_id IS NULL;

-- Hapus kategori seed lama yang tidak punya user_id
DELETE FROM categories WHERE user_id IS NULL;

-- Hapus wallet seed lama yang tidak punya user_id
DELETE FROM wallets WHERE user_id IS NULL;

-- Hapus profil seed lama yang tidak ada di auth.users
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- ─── 3. Update profiles: id is FK to auth.users ──────────

-- Profiles sudah pakai UUID sebagai PK.
-- Kita pastikan constraint FK ada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- ─── 3. Enable RLS pada semua tabel ──────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ─── 4. Create RLS Policies ─────────────────────────────

-- Profiles: user hanya bisa akses profil miliknya sendiri
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Categories
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (user_id = auth.uid());

-- Wallets
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own wallets" ON wallets;
CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own wallets" ON wallets;
CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own wallets" ON wallets;
CREATE POLICY "Users can delete own wallets"
  ON wallets FOR DELETE
  USING (user_id = auth.uid());

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (user_id = auth.uid());

-- ─── 5. Trigger: auto-create profile + seed data untuk user baru ─

-- Function: saat user baru registrasi, buat profil + default categories + default wallet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Ambil nama dari metadata (jika ada)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Buat profil
  INSERT INTO public.profiles (id, name, email, theme)
  VALUES (NEW.id, user_name, COALESCE(NEW.email, ''), 'dark')
  ON CONFLICT (id) DO NOTHING;

  -- Seed default categories untuk user baru
  INSERT INTO public.categories (name, icon, color, type, is_default, user_id) VALUES
    ('Makanan',      'FOOD', '#f97316', 'expense', true, NEW.id),
    ('Transportasi', 'MOVE', '#06b6d4', 'expense', true, NEW.id),
    ('Tagihan',      'BILL', '#f43f5e', 'expense', true, NEW.id),
    ('Gaji',         'PAY',  '#22c55e', 'income',  true, NEW.id),
    ('Bonus',        'PLUS', '#6366f1', 'income',  true, NEW.id);

  -- Seed default wallet untuk user baru
  INSERT INTO public.wallets (name, is_default, user_id) VALUES
    ('Tunai', true, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: jalankan setelah insert di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 6. (Opsional) Assign data lama ke user tertentu ────
-- Uncomment dan ganti UUID di bawah jika ingin assign data existing ke satu user.
-- UPDATE categories SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE wallets SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE transactions SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
