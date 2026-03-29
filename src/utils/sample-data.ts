import type { Transaction, Wallet } from "@/types";

export const guestWallets: Wallet[] = [
  {
    id: "guest-wallet-1",
    user_id: "guest",
    name: "Dompet Utama",
    category: "Cash",
    location: "Jakarta",
    balance: 3250000,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-wallet-2",
    user_id: "guest",
    name: "Tabungan",
    category: "Bank",
    location: "BCA",
    balance: 7850000,
    created_at: new Date().toISOString(),
  },
];

export const guestTransactions: Transaction[] = [
  {
    id: "trx-1",
    wallet_id: "guest-wallet-1",
    user_id: "guest",
    description: "Belanja mingguan",
    amount: 250000,
    type: "expense",
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    category_id: "guest-cat-1",
  },
  {
    id: "trx-2",
    wallet_id: "guest-wallet-1",
    user_id: "guest",
    description: "Gaji freelance",
    amount: 1500000,
    type: "income",
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    category_id: "guest-cat-4",
  },
  {
    id: "trx-3",
    wallet_id: "guest-wallet-2",
    user_id: "guest",
    description: "Langganan aplikasi",
    amount: 75000,
    type: "expense",
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    category_id: "guest-cat-3",
  },
];

export const guestExpenseByCategory = [
  { name: "Makanan", value: 45 },
  { name: "Transportasi", value: 25 },
  { name: "Hiburan", value: 18 },
  { name: "Lainnya", value: 12 },
];

export const walletCategories = [
  "Cash",
  "Bank",
  "E-Wallet",
  "Investasi",
  "Lainnya",
];
