
export type StatSummary = {
  totalUsers: number;
  totalTransactions: number;
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  totalSavings: number;
  totalSpending: number;
};

export type UserSummary = {
  id: string;
  username: string;
  nickname: string | null;
  transactions: number;
  goals: number;
  tasks: number;
  balance: number;
};

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0', '#F4D03F'];
