
import { useState, useEffect } from 'react';
import { PiggyBank, Target, ListTodo, ChevronsRight, TrendingUp, HandCoins } from 'lucide-react';
import { Link } from 'react-router-dom';
import MascotGuide from './MascotGuide';
import AnimatedNumber from './ui/AnimatedNumber';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { 
  LineChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

type DashboardStat = {
  id: string;
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  suffix: string;
};

type Transaction = {
  id: string;
  amount: number;
  category: string;
  type: string;
  description: string | null;
  date: string;
  created_at: string;
};

type DailyTransactionData = {
  date: string;
  income: number;
  expense: number;
  balance: number;
};

const Dashboard = () => {
  const [greeting, setGreeting] = useState('안녕하세요!');
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStat[]>([
    {
      id: 'balance',
      title: '현재 잔액',
      value: 0,
      change: 0,
      icon: HandCoins,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      suffix: '원',
    },
    {
      id: 'savings',
      title: '저축액',
      value: 0,
      change: 0,
      icon: PiggyBank,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      suffix: '원',
    },
    {
      id: 'tasks',
      title: '미완료 할일',
      value: 0,
      change: 0,
      icon: ListTodo,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
      suffix: '개',
    },
    {
      id: 'points',
      title: '포인트',
      value: 0,
      change: 0,
      icon: Target,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-100',
      suffix: '점',
    },
  ]);

  // Fetch transactions data
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      // Get transactions for the current month
      const currentDate = new Date();
      const firstDayOfMonth = startOfMonth(currentDate);
      const lastDayOfMonth = endOfMonth(currentDate);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('date', lastDayOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: '데이터 로딩 실패',
          description: '거래 내역을 가져오는데 실패했습니다.',
          variant: 'destructive',
        });
        return [];
      }
      
      return data as Transaction[];
    },
    enabled: !!currentUser?.id,
  });

  // Fetch tasks data
  const { data: tasksCount } = useQuery({
    queryKey: ['tasksCount', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return 0;
      
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'todo');
      
      if (error) {
        console.error('Error fetching tasks count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!currentUser?.id,
  });

  // Fetch goals data for savings
  const { data: goalsSavings } = useQuery({
    queryKey: ['goalsSavings', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return 0;
      
      const { data, error } = await supabase
        .from('goals')
        .select('current_amount')
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error fetching goals savings:', error);
        return 0;
      }
      
      // Sum up all current_amount values
      return data.reduce((sum, goal) => sum + goal.current_amount, 0);
    },
    enabled: !!currentUser?.id,
  });

  // Calculate balance from transactions
  const calculateBalance = (transactions: Transaction[] = []) => {
    return transactions.reduce((balance, transaction) => {
      if (transaction.type === 'income') {
        return balance + transaction.amount;
      } else {
        return balance - transaction.amount;
      }
    }, 0);
  };

  // Process transactions data for the chart
  const getProcessedTransactionData = (): DailyTransactionData[] => {
    if (!transactions || transactions.length === 0) {
      // Generate placeholder data for the last 14 days if no data
      const placeholderData: DailyTransactionData[] = [];
      const today = new Date();
      
      for (let i = 13; i >= 0; i--) {
        const date = subDays(today, i);
        placeholderData.push({
          date: date.toISOString().split('T')[0],
          income: 0,
          expense: 0,
          balance: 0
        });
      }
      
      return placeholderData;
    }

    // Group transactions by date
    const groupedByDate = transactions.reduce((acc: Record<string, DailyTransactionData>, transaction) => {
      const date = transaction.date;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          income: 0,
          expense: 0,
          balance: 0
        };
      }
      
      if (transaction.type === 'income') {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      
      return acc;
    }, {});
    
    // Fill in missing dates and calculate running balance
    const sortedDates = Object.keys(groupedByDate).sort();
    let runningBalance = 0;
    
    if (sortedDates.length > 0) {
      // Calculate running balance for each day
      for (const date of sortedDates) {
        const dayData = groupedByDate[date];
        runningBalance += dayData.income - dayData.expense;
        dayData.balance = runningBalance;
      }
    }
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Update stats when data loads
  useEffect(() => {
    if (currentUser?.id) {
      const balance = calculateBalance(transactions);
      const savings = goalsSavings || 0;
      const incompleteTasks = tasksCount || 0;
      const points = 0; // TODO: Implement points from badges or achievements
      
      setStats([
        {
          id: 'balance',
          title: '현재 잔액',
          value: balance,
          change: 0, // Calculate change percentage if historical data available
          icon: HandCoins,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-100',
          suffix: '원',
        },
        {
          id: 'savings',
          title: '저축액',
          value: savings,
          change: 0, // Calculate change percentage if historical data available
          icon: PiggyBank,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-100',
          suffix: '원',
        },
        {
          id: 'tasks',
          title: '미완료 할일',
          value: incompleteTasks,
          change: 0, // Calculate change percentage if historical data available
          icon: ListTodo,
          iconColor: 'text-amber-600',
          bgColor: 'bg-amber-100',
          suffix: '개',
        },
        {
          id: 'points',
          title: '포인트',
          value: points,
          change: 0, // Calculate change percentage if historical data available
          icon: Target,
          iconColor: 'text-pink-600',
          bgColor: 'bg-pink-100',
          suffix: '점',
        },
      ]);
    }
  }, [currentUser?.id, transactions, tasksCount, goalsSavings]);

  // Update greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let newGreeting = '';

    if (hour >= 5 && hour < 12) {
      newGreeting = '좋은 아침이에요!';
    } else if (hour >= 12 && hour < 17) {
      newGreeting = '안녕하세요!';
    } else if (hour >= 17 && hour < 21) {
      newGreeting = '좋은 저녁이에요!';
    } else {
      newGreeting = '안녕히 주무세요!';
    }

    setGreeting(newGreeting);
  }, []);

  // Generate chart data
  const chartData = getProcessedTransactionData();
  const chartConfig = {
    income: {
      label: "수입",
      theme: {
        light: "#4ade80",
        dark: "#4ade80",
      },
    },
    expense: {
      label: "지출",
      theme: {
        light: "#f87171",
        dark: "#f87171",
      },
    },
    balance: {
      label: "잔액",
      theme: {
        light: "#60a5fa",
        dark: "#60a5fa",
      },
    },
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header with greeting */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">{greeting}</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-300">
            {currentUser?.nickname ? `${currentUser.nickname}님, ` : ''}
            오늘도 용돈을 관리해 볼까요?
          </p>
        </div>
        <MascotGuide />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id} className="candy-card p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm dark:text-gray-300">{stat.title}</p>
                <h3 className="text-xl font-bold mt-1 dark:text-white">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    formatOptions={{ style: 'decimal' }}
                  />
                </h3>
              </div>
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span
                className={cn(
                  "flex items-center font-medium",
                  stat.change > 0 ? "text-green-600" : stat.change < 0 ? "text-red-500" : "text-gray-500"
                )}
              >
                <TrendingUp
                  size={14}
                  className={cn(
                    "mr-0.5",
                    stat.change >= 0 ? "rotate-0" : "rotate-180"
                  )}
                />
                {Math.abs(stat.change)}%
              </span>
              <span className="text-gray-500 ml-1 dark:text-gray-300">최근 변화</span>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Usage Graph */}
      <div className="candy-card p-5">
        <h2 className="text-lg font-bold mb-4 dark:text-white">이번 달 용돈 사용 추이</h2>
        <div className="h-72">
          {isLoadingTransactions ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="px-2">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  tickMargin={10}
                  tickFormatter={(value) => format(parseISO(value), 'dd일', { locale: ko })}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  tickLine={false} 
                  tickMargin={10} 
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <ChartTooltipContent 
                          active={active} 
                          payload={payload} 
                          labelFormatter={(value) => {
                            if (typeof value === 'string') {
                              return format(parseISO(value), 'M월 d일', { locale: ko });
                            }
                            return value;
                          }}
                        />
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="income"
                  stroke="var(--color-income)"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  name="expense"
                  stroke="var(--color-expense)"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  name="balance"
                  stroke="var(--color-balance)"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingBottom: '10px'
                  }}
                  formatter={(value) => {
                    const valueMap: Record<string, string> = {
                      income: '수입',
                      expense: '지출',
                      balance: '잔액'
                    };
                    return valueMap[value] || value;
                  }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="candy-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold dark:text-white">최근 활동</h2>
          <Link
            to="/allowance"
            className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center dark:hover:text-blue-300"
          >
            모두 보기 <ChevronsRight size={16} />
          </Link>
        </div>

        <div className="space-y-3">
          {isLoadingTransactions ? (
            <div className="py-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2 dark:border-blue-400"></div>
              <p className="text-sm text-gray-500 dark:text-gray-300">데이터 로딩 중...</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            transactions.slice(0, 3).map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                      transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    )}
                  >
                    <span 
                      className={cn(
                        "text-lg font-bold",
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                      )}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{transaction.description || transaction.category}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span 
                  className={cn(
                    "font-semibold",
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  )}
                >
                  {transaction.amount.toLocaleString()}원
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-300">최근 거래 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
