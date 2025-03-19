
import { useState, useEffect } from 'react';
import { PiggyBank, Target, ListTodo, ChevronsRight, TrendingUp, HandCoins } from 'lucide-react';
import { Link } from 'react-router-dom';
import MascotGuide from './MascotGuide';
import AnimatedNumber from './ui/AnimatedNumber';
import { cn } from '@/lib/utils';

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

const Dashboard = () => {
  const [greeting, setGreeting] = useState('안녕하세요!');
  const [stats, setStats] = useState<DashboardStat[]>([
    {
      id: 'balance',
      title: '현재 잔액',
      value: 5000,
      change: 10,
      icon: HandCoins,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      suffix: '원',
    },
    {
      id: 'savings',
      title: '저축액',
      value: 55000,
      change: 22,
      icon: PiggyBank,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      suffix: '원',
    },
    {
      id: 'tasks',
      title: '미완료 할일',
      value: 2,
      change: -1,
      icon: ListTodo,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
      suffix: '개',
    },
    {
      id: 'points',
      title: '포인트',
      value: 30,
      change: 30,
      icon: Target,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-100',
      suffix: '점',
    },
  ]);

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
          <h1 className="text-2xl font-bold">{greeting}</h1>
          <p className="text-gray-500 mt-1">오늘도 용돈을 관리해 볼까요?</p>
        </div>
        <MascotGuide message="목표를 달성하면 포인트를 얻을 수 있어요!" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id} className="candy-card p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <h3 className="text-xl font-bold mt-1">
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
              <span className="text-gray-500 ml-1">최근 변화</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="candy-card p-5">
        <h2 className="text-lg font-bold mb-4">빠른 메뉴</h2>
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
              hover:bg-gray-100 transition-all hover:scale-105"
            >
              <div className={`p-3 rounded-full ${action.color} mb-2`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="candy-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">최근 활동</h2>
          <Link
            to="/allowance"
            className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            모두 보기 <ChevronsRight size={16} />
          </Link>
        </div>

        <div className="space-y-3">
          {[
            { title: '주간 용돈', amount: '10,000원', type: 'income', time: '2일 전' },
            { title: '아이스크림', amount: '3,000원', type: 'expense', time: '어제' },
            { title: '버스비', amount: '2,000원', type: 'expense', time: '오늘' },
          ].map((activity, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
            >
              <div className="flex items-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                    activity.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  )}
                >
                  <span 
                    className={cn(
                      "text-lg font-bold",
                      activity.type === 'income' ? 'text-green-600' : 'text-red-500'
                    )}
                  >
                    {activity.type === 'income' ? '+' : '-'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
              <span 
                className={cn(
                  "font-semibold",
                  activity.type === 'income' ? 'text-green-600' : 'text-red-500'
                )}
              >
                {activity.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
