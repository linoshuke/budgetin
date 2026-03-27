export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSigned(value: number, type: "income" | "expense") {
  const prefix = type === "expense" ? "-" : "+";
  return `${prefix} ${formatCurrency(Math.abs(value))}`;
}
