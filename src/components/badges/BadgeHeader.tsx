
import { Award } from 'lucide-react';

interface BadgeHeaderProps {
  completedCount: number;
  totalCount: number;
}

const BadgeHeader = ({ completedCount, totalCount }: BadgeHeaderProps) => {
  const completionPercentage = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0;
  
  return (
    <div className="candy-card bg-gradient-to-br from-purple-100 to-indigo-100 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center md:justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-indigo-100 p-3 rounded-full mr-4">
            <Award className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-indigo-900">나의 배지</h2>
            <p className="text-sm text-indigo-700">
              {completedCount}개의 배지를 획득했어요 ({completionPercentage}%)
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/3 bg-white rounded-full h-2.5 overflow-hidden border border-indigo-200">
          <div 
            className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2.5 rounded-full transition-all duration-1000"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BadgeHeader;
