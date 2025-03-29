
import { Users, Coins, Target, CheckSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatSummary } from './types';

type StatCardsProps = {
  stats: StatSummary;
};

const StatCards = ({ stats }: StatCardsProps) => {
  return (
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
  );
};

export default StatCards;
