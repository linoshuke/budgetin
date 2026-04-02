"use client";

import { useMemo, useRef, useState } from "react";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import {
  getSerializableAppSettings,
  useAppSettingsStore,
  type CurrencyCode,
  type LocaleCode,
  type ThemeMode,
  type TextScale,
  type DefaultPeriod,
  type DefaultTransactionType,
} from "@/stores/appSettingsStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatCompactCurrency } from "@/utils/format";

const currencyOptions: Array<{ value: CurrencyCode; label: string }> = [
  { value: "IDR", label: "IDR - Rupiah" },
  { value: "USD", label: "USD - Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
];

const localeOptions: Array<{ value: LocaleCode; label: string }> = [
  { value: "id-ID", label: "Indonesia (id-ID)" },
  { value: "en-US", label: "English (en-US)" },
];

const textScaleOptions: Array<{ value: TextScale; label: string }> = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Normal" },
  { value: "lg", label: "Large" },
];

const periodOptions: Array<{ value: DefaultPeriod; label: string }> = [
  { value: "daily", label: "Harian" },
  { value: "monthly", label: "Bulanan" },
  { value: "range", label: "Rentang" },
];

const typeOptions: Array<{ value: DefaultTransactionType; label: string }> = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
];

const reportOptions = [
  { value: 0, label: "Bulan ini" },
  { value: -1, label: "Bulan lalu" },
];

export default function SettingsPage() {
  const wallets = useBudgetStore((state) => state.wallets);
  const categories = useBudgetStore((state) => state.categories);

  const {
    themeMode,
    textScale,
    currency,
    numberLocale,
    dateLocale,
    defaultTransactionType,
    defaultWalletId,
    defaultCategoryId,
    defaultPeriod,
    defaultReportOffset,
    notificationsDaily,
    notificationsWeekly,
    notificationsBudgetAlerts,
    privacyHideAmounts,
    privacyAutoLock,
  } = useAppSettingsStore();

  const setSettings = useAppSettingsStore((state) => state.setSettings);
  const importSettings = useAppSettingsStore((state) => state.importSettings);

  const [savingTheme, setSavingTheme] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const walletOptions = useMemo(
    () => [{ id: "", name: "Tanpa default" }, ...wallets.map((wallet) => ({ id: wallet.id, name: wallet.name }))],
    [wallets],
  );

  const categoryOptions = useMemo(
    () => [{ id: "", name: "Tanpa default" }, ...categories.map((category) => ({ id: category.id, name: category.name }))],
    [categories],
  );

  const handleThemeChange = async (nextTheme: ThemeMode) => {
    setSettings({ themeMode: nextTheme });
    if (nextTheme === "system") return;
    setSavingTheme(true);
    try {
      await budgetActions.setTheme(nextTheme);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleExport = () => {
    const payload = {
      settings: getSerializableAppSettings(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budgetin-settings-backup.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { settings?: Record<string, unknown> };
      if (parsed.settings && typeof parsed.settings === "object") {
        importSettings(parsed.settings);
      }
    } catch (error) {
      console.warn("Gagal mengimpor data pengaturan:", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface">Pengaturan Aplikasi</h1>
        <p className="text-sm text-on-surface-variant">
          Atur tampilan dan preferensi aplikasi tanpa mengubah data akun Anda.
        </p>
      </header>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Tampilan & Tema</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Sesuaikan tema dan ukuran teks.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["system", "dark", "light"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleThemeChange(mode)}
              disabled={savingTheme}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                themeMode === mode
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {mode === "system" ? "System" : mode === "dark" ? "Dark" : "Light"}
            </button>
          ))}
          {savingTheme ? <span className="self-center text-xs text-on-surface-variant">Menyimpan...</span> : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            Skala teks
            <select
              value={textScale}
              onChange={(event) => setSettings({ textScale: event.target.value as TextScale })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {textScaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Preferensi Format</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Konsistensi format angka dan tanggal.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            Mata uang utama
            <select
              value={currency}
              onChange={(event) => setSettings({ currency: event.target.value as CurrencyCode })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            Format angka
            <select
              value={numberLocale}
              onChange={(event) => setSettings({ numberLocale: event.target.value as LocaleCode })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            Format tanggal
            <select
              value={dateLocale}
              onChange={(event) => setSettings({ dateLocale: event.target.value as LocaleCode })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-on-surface-variant">Contoh nominal</span>
            <span className="tnum font-semibold text-on-surface">{formatCurrency(1250000)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-on-surface-variant">Contoh ringkas</span>
            <span className="tnum font-semibold text-on-surface">{formatCompactCurrency(1250000)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-on-surface-variant">Contoh tanggal</span>
            <span className="font-semibold text-on-surface">{formatDate(new Date().toISOString(), true)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Perilaku Transaksi</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Buat input transaksi lebih cepat.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            Default tipe transaksi
            <select
              value={defaultTransactionType}
              onChange={(event) => setSettings({ defaultTransactionType: event.target.value as DefaultTransactionType })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            Default dompet
            <select
              value={defaultWalletId ?? ""}
              onChange={(event) => setSettings({ defaultWalletId: event.target.value || null })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {walletOptions.map((option) => (
                <option key={option.id || "none"} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            Default kategori
            <select
              value={defaultCategoryId ?? ""}
              onChange={(event) => setSettings({ defaultCategoryId: event.target.value || null })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {categoryOptions.map((option) => (
                <option key={option.id || "none"} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Filter & Periode Default</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Atur tampilan awal halaman transaksi dan laporan.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            Default periode transaksi
            <select
              value={defaultPeriod}
              onChange={(event) => setSettings({ defaultPeriod: event.target.value as DefaultPeriod })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            Default bulan laporan
            <select
              value={defaultReportOffset}
              onChange={(event) =>
                setSettings({ defaultReportOffset: Number(event.target.value) as 0 | -1 })
              }
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Notifikasi</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Kelola pengingat agar konsisten.</p>

        <div className="mt-4 grid gap-3">
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            Ringkasan harian
            <input
              type="checkbox"
              checked={notificationsDaily}
              onChange={(event) => setSettings({ notificationsDaily: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            Ringkasan mingguan
            <input
              type="checkbox"
              checked={notificationsWeekly}
              onChange={(event) => setSettings({ notificationsWeekly: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            Pengingat limit anggaran
            <input
              type="checkbox"
              checked={notificationsBudgetAlerts}
              onChange={(event) => setSettings({ notificationsBudgetAlerts: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Privasi Lokal</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Lindungi data saat aplikasi dibuka di publik.</p>

        <div className="mt-4 grid gap-3">
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            Sembunyikan nominal di layar
            <input
              type="checkbox"
              checked={privacyHideAmounts}
              onChange={(event) => setSettings({ privacyHideAmounts: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            Autolock (PIN/biometrik)
            <input
              type="checkbox"
              checked={privacyAutoLock}
              onChange={(event) => setSettings({ privacyAutoLock: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Cadangan Lokal</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Ekspor atau impor pengaturan aplikasi.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-outline-variant/20 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
          >
            Ekspor Pengaturan
          </button>
          <label className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
            Impor Pengaturan
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
