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
import { useTasks } from '@/hooks/useTasks';

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

const Dashboard = () => {
  const [greeting, setGreeting] = useState('안녕하세요!');
  const { currentUser } = useUser();
  const { toast } = useToast();
  
  // Fetch tasks data
  const { tasks } = useTasks(currentUser?.id);
  const incompleteTasks = tasks?.filter(task => !task.completed).length || 0;

  // Fetch transactions for balance
  const { data: transactions } = useQuery({
    queryKey: ['transactions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
      
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

  // Fetch goals for savings amount
  const { data: goals } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error fetching goals:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Calculate current balance from transactions
  const calculateBalance = (transactions: Transaction[] = []) => {
    return transactions.reduce((balance, transaction) => {
      if (transaction.type === 'income') {
        return balance + transaction.amount;
      } else {
        return balance - transaction.amount;
      }
    }, 0);
  };

  // Calculate total savings from goals
  const calculateTotalSavings = (goals: any[] = []) => {
    return goals.reduce((total, goal) => total + (goal.current_amount || 0), 0);
  };

  const balance = calculateBalance(transactions);
  const totalSavings = calculateTotalSavings(goals);

  const stats = [
    {
      id: 'balance',
      title: '현재 잔액',
      value: balance,
      change: 0,
      icon: HandCoins,
      iconColor: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      suffix: '원',
    },
    {
      id: 'savings',
      title: '저축액',
      value: totalSavings,
      change: 0,
      icon: PiggyBank,
      iconColor: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      suffix: '원',
    },
    {
      id: 'tasks',
      title: '미완료 할일',
      value: incompleteTasks,
      change: 0,
      icon: ListTodo,
      iconColor: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
      suffix: '개',
    },
  ];

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
      <div className="grid grid-cols-3 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.id} className="candy-card p-4 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-gray-600 text-sm dark:text-gray-300 mb-1">{stat.title}</p>
                <h3 className="text-xl font-bold dark:text-white">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    formatOptions={{ style: 'decimal' }}
                  />
                </h3>
              </div>
              <div className={cn("p-3 rounded-xl shadow-lg", stat.bgColor)}>
                <stat.icon className={cn("w-6 h-6", stat.iconColor)} />
              </div>
            </div>
            <div className="flex items-center text-xs">
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

      {/* Quick Actions */}
      <div className="candy-card p-5">
        <h2 className="text-lg font-bold mb-4 dark:text-white">빠른 메뉴</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: '용돈', icon: HandCoins, color: 'bg-blue-500', link: '/allowance' },
            { title: '목표', icon: Target, color: 'bg-purple-500', link: '/goals' },
            { title: '할일', icon: ListTodo, color: 'bg-amber-500', link: '/tasks' },
          ].map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 
              hover:bg-gray-100 transition-all hover:scale-105 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <div className={`p-3 rounded-full ${action.color} mb-2`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium dark:text-gray-200">{action.title}</span>
            </Link>
          ))}
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
          {transactions === undefined ? (
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
