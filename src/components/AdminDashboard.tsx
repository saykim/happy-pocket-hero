
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Coins, Target, CheckSquare } from 'lucide-react';

type StatSummary = {
  totalUsers: number;
  totalTransactions: number;
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  totalSavings: number;
  totalSpending: number;
};

type UserSummary = {
  id: string;
  username: string;
  nickname: string | null;
  transactions: number;
  goals: number;
  tasks: number;
  balance: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0', '#F4D03F'];

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

  // Prepare data for charts
  const userActivityData = userSummaries.map(user => ({
    name: user.nickname || user.username,
    거래: user.transactions,
    목표: user.goals,
    할일: user.tasks,
  }));

  const financeDistributionData = [
    { name: '총 수입', value: stats.totalSavings },
    { name: '총 지출', value: stats.totalSpending },
  ];

  const taskCompletionData = [
    { name: '완료된 할일', value: stats.completedTasks },
    { name: '미완료 할일', value: stats.totalTasks - stats.completedTasks },
  ];

  const goalCompletionData = [
    { name: '달성한 목표', value: stats.completedGoals },
    { name: '진행중 목표', value: stats.totalGoals - stats.completedGoals },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">관리자 대시보드</h1>
        <Button onClick={refreshData} variant="outline">
          데이터 새로고침
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center">
          <Users className="h-8 w-8 text-blue-500 mb-2" />
          <h3 className="text-lg font-semibold">사용자</h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </Card>

        <Card className="p-4 flex flex-col items-center">
          <Coins className="h-8 w-8 text-green-500 mb-2" />
          <h3 className="text-lg font-semibold">거래</h3>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </Card>

        <Card className="p-4 flex flex-col items-center">
          <Target className="h-8 w-8 text-purple-500 mb-2" />
          <h3 className="text-lg font-semibold">목표</h3>
          <p className="text-2xl font-bold">{stats.completedGoals} / {stats.totalGoals}</p>
        </Card>

        <Card className="p-4 flex flex-col items-center">
          <CheckSquare className="h-8 w-8 text-amber-500 mb-2" />
          <h3 className="text-lg font-semibold">할일</h3>
          <p className="text-2xl font-bold">{stats.completedTasks} / {stats.totalTasks}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">사용자별 활동</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="거래" fill="#8884d8" />
                <Bar dataKey="목표" fill="#82ca9d" />
                <Bar dataKey="할일" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Finance Distribution */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">자금 분배</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {financeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Goal Completion */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">목표 달성 현황</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={goalCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {goalCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Completion */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">할일 완료 현황</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* User Summary Table */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">사용자 요약</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="py-2 px-4 text-left">이름</th>
                <th className="py-2 px-4 text-left">거래수</th>
                <th className="py-2 px-4 text-left">목표수</th>
                <th className="py-2 px-4 text-left">할일수</th>
                <th className="py-2 px-4 text-left">잔액</th>
              </tr>
            </thead>
            <tbody>
              {userSummaries.map((user) => (
                <tr key={user.id} className="border-b dark:border-gray-700">
                  <td className="py-2 px-4">{user.nickname || user.username}</td>
                  <td className="py-2 px-4">{user.transactions}</td>
                  <td className="py-2 px-4">{user.goals}</td>
                  <td className="py-2 px-4">{user.tasks}</td>
                  <td className={`py-2 px-4 ${user.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {user.balance.toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
