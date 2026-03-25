export type TransactionType = "income" | "expense";

export interface User {
  id: string;
  email: string;
  name: string | null;
  monthly_target_budget: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  description: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

export interface DashboardSummary {
  balance: number;
  incomeMonth: number;
  expensesMonth: number;
  remainingBudget: number;
  topSpendingCategory: string;
  overBudget: boolean;
}
