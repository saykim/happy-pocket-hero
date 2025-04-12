
import { BadgeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import BadgeCard, { BadgeType } from '../BadgeCard';

interface BadgeGridProps {
  badges: BadgeType[];
  isLoading: boolean;
}

const BadgeGrid = ({ badges, isLoading }: BadgeGridProps) => {
  const { toast } = useToast();
  const [previousBadges, setPreviousBadges] = useState<BadgeType[]>([]);
  
  // Check for newly completed badges and show toast notifications
  useEffect(() => {
    if (!badges || badges.length === 0) {
      return;
    }
    
    // First time loading badges, just set them without notifications
    if (previousBadges.length === 0) {
      console.log('초기 배지 데이터 설정:', badges.length);
      setPreviousBadges(badges);
      return;
    }
    
    // Find newly completed badges by comparing current with previous state
    const newlyCompletedBadges = badges.filter(badge => {
      // Find the same badge in previous state
      const prevBadge = previousBadges.find(pb => pb.id === badge.id);
      
      // Check if it's now completed but wasn't before
      const isNewlyCompleted = badge.completed && prevBadge && !prevBadge.completed;
      
      if (isNewlyCompleted) {
        console.log(`새로 획득한 배지 감지: ${badge.name}`);
      }
      
      return isNewlyCompleted;
    });
    
    if (newlyCompletedBadges.length > 0) {
      console.log('새로 획득한 배지:', newlyCompletedBadges.map(b => b.name).join(', '));
      
      // Show a toast notification for each newly completed badge
      newlyCompletedBadges.forEach(badge => {
        toast({
          title: '축하합니다! 🎉',
          description: `"${badge.name}" 배지를 획득했습니다!`,
          duration: 5000,
        });
      });
    } else {
      // Log that no new badges were detected
      console.log('새로운 완료 배지가 감지되지 않았습니다.');
    }
    
    // Debug: Log current badge progress for all badges
    console.log('현재 배지 상태:', badges.map(b => ({
      name: b.name, 
      progress: b.progress, 
      required: b.required_count,
      completed: b.completed
    })));
    
    // Update previous badges for next comparison
    setPreviousBadges(badges);
  }, [badges, toast]);
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-600">배지 정보를 불러오는 중...</p>
      </div>
    );
  }
  
  if (!badges || badges.length === 0) {
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
