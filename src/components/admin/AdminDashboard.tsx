
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  StatCards,
  UserActivityChart,
  FinanceDistributionChart,
  GoalCompletionChart,
  TaskCompletionChart,
  UserSummaryTable
} from './index';
import { StatSummary, UserSummary } from './types';

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatSummary>({
    totalUsers: 0,
    totalTransactions: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalSavings: 0,
    totalSpending: 0,
  });
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('username', 'admin');

      if (usersError) throw usersError;

      // Fetch transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*');

      if (transactionsError) throw transactionsError;

      // Fetch goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*');

      if (goalsError) throw goalsError;

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // Prepare user summaries
      const summaries: UserSummary[] = users.map(user => {
        const userTransactions = transactions.filter(t => t.user_id === user.id);
        const userGoals = goals.filter(g => g.user_id === user.id);
        const userTasks = tasks.filter(t => t.user_id === user.id);
        
        const income = userTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = userTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          transactions: userTransactions.length,
          goals: userGoals.length,
          tasks: userTasks.length,
          balance: income - expense
        };
      });

      // Calculate overall stats
      const totalSavings = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalSpending = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;

      setStats({
        totalUsers: users.length,
        totalTransactions: transactions.length,
        totalGoals: goals.length,
        completedGoals,
        totalTasks: tasks.length,
        completedTasks,
        totalSavings,
        totalSpending
      });

      setUserSummaries(summaries);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: '데이터 로딩 실패',
        description: '관리자 데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchAdminData();
    toast({
      title: '데이터 새로고침',
      description: '최신 데이터를 불러왔습니다.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">관리자 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">관리자 대시보드</h1>
        <Button onClick={refreshData} variant="outline">
          데이터 새로고침
        </Button>
      </div>

      {/* User Activity Chart - Moved to top */}
      <UserActivityChart userSummaries={userSummaries} />
      
      {/* User Summary Table - Moved to second position */}
      <UserSummaryTable userSummaries={userSummaries} />

      {/* Stats Cards */}
      <StatCards stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinanceDistributionChart stats={stats} />
        <GoalCompletionChart stats={stats} />
        <TaskCompletionChart stats={stats} />
      </div>
    </div>
  );
};

export default AdminDashboard;
