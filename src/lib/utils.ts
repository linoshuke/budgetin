import { getAppSettingsState } from "@/stores/appSettingsStore";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveFormatConfig() {
  const settings = getAppSettingsState();
  return {
    locale: settings.numberLocale ?? "id-ID",
    currency: settings.currency ?? "IDR",
    dateLocale: settings.dateLocale ?? "id-ID",
    hideAmounts: settings.privacyHideAmounts ?? false,
  };
}

export function formatCurrency(value: number) {
  const { locale, currency, hideAmounts } = resolveFormatConfig();
  if (hideAmounts) return "****";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string, withYear = false) {
  const { dateLocale } = resolveFormatConfig();
  return new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "short",
    year: withYear ? "numeric" : undefined,
  }).format(new Date(date));
}

export function monthKey(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getIsoDateToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const { dateLocale } = resolveFormatConfig();
  return new Intl.DateTimeFormat(dateLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`)
    .join(",");
}
