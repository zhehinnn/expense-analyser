export interface Transaction {
  id: string;
  date: string;
  description: string;
  ref: string;
  withdrawal: number;
  deposit: number;
  balance: number;
  category: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  color: string;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

export interface StatementInfo {
  accountNumber: string;
  statementDate: string;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpenses: number;
}
