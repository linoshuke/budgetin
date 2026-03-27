export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  category: string;
  location: string | null;
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  created_at: string;
}

export interface MonthlySummary {
  id: string;
  user_id: string;
  wallet_id: string;
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
}
