
import { CheckCircle } from 'lucide-react';

interface TaskStatsProps {
  completedCount: number;
}

export const TaskStats = ({ completedCount }: TaskStatsProps) => {
  return (
    <div className="candy-card bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-amber-800">완료한 할 일</h3>
        <div className="flex items-center text-amber-800">
          <CheckCircle className="mr-1 text-green-500" size={20} />
          <span className="text-2xl font-bold">{completedCount}</span>
          <span className="ml-1 text-sm">개</span>
        </div>
      </div>
    </div>
  );
};
