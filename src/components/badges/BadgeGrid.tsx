
import { BadgeX } from 'lucide-react';
import BadgeCard, { BadgeType } from '../BadgeCard';

interface BadgeGridProps {
  badges: BadgeType[];
  isLoading: boolean;
}

const BadgeGrid = ({ badges, isLoading }: BadgeGridProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-600">배지 정보를 불러오는 중...</p>
      </div>
    );
  }
  
  if (badges.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <BadgeX size={48} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">해당 카테고리에 배지가 없습니다.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map(badge => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
};

export default BadgeGrid;
