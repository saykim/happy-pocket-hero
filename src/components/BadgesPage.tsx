import { useState, useEffect } from 'react';
import { Award, BadgeCheck, BadgeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import BadgeCard, { BadgeType } from './BadgeCard';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type BadgeCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
};

// Define badge categories with icons and colors
const BADGE_CATEGORIES: BadgeCategory[] = [
  { id: 'all', name: '전체', icon: Award, color: 'text-purple-500' },
  { id: 'savings', name: '저축', icon: BadgeCheck, color: 'text-blue-500' },
  { id: 'expenses', name: '지출', icon: BadgeCheck, color: 'text-green-500' },
  { id: 'tasks', name: '할일', icon: BadgeCheck, color: 'text-amber-500' },
  { id: 'goals', name: '목표', icon: BadgeCheck, color: 'text-pink-500' },
  { id: 'activity', name: '활동', icon: BadgeCheck, color: 'text-indigo-500' },
];

const BadgesPage = () => {
  const { currentUser } = useUser();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Fetch badges from Supabase using a custom type-safe approach
  const { data: badges = [], isLoading, refetch } = useQuery({
    queryKey: ['badges', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      
      console.log('🏆 배지 데이터 로딩 시작...');
      
      // Get all badges with explicit typing for the response
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');
      
      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
        return [];
      }
      
      console.log(`📊 총 ${allBadges?.length || 0}개의 배지 정보 로드됨`);
      
      // Get user's badge progress with explicit typing
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (userBadgesError) {
        console.error('Error fetching user badges:', userBadgesError);
        return [];
      }
      
      console.log(`👤 사용자의 ${userBadges?.length || 0}개 배지 진행 상황 로드됨`);
      
      // Combine the data with proper type checking
      const result = allBadges.map(badge => {
        const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
        const progress = userBadge?.progress || 0;
        const completed = userBadge?.completed || false;
        
        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          required_count: badge.required_count,
          category: badge.category,
          progress: progress,
          completed: completed
        } as BadgeType;
      });
      
      const completedCount = result.filter(b => b.completed).length;
      console.log(`✅ 완료된 배지: ${completedCount}/${result.length} (${Math.round((completedCount / result.length) * 100)}%)`);
      
      return result;
    },
    enabled: !!currentUser,
    staleTime: 30 * 1000, // 30초 동안 캐시 데이터 사용
    refetchInterval: 60 * 1000, // 60초마다 자동 갱신
    refetchOnWindowFocus: true // 탭 포커스 시 갱신
  });
  
  // 페이지가 처음 로드될 때와 activeCategory가 변경될 때 강제 갱신
  useEffect(() => {
    if (currentUser) {
      refetch();
    }
  }, [activeCategory, currentUser, refetch]);
  
  // Filter badges by category
  const filteredBadges = badges.filter(badge => 
    activeCategory === 'all' || badge.category === activeCategory
  );
  
  // Count completed badges
  const completedCount = badges.filter(badge => badge.completed).length;
  const totalCount = badges.length;
  const completionPercentage = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0;
  
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
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
      
      {/* Category tabs */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-gray-100 p-1 rounded-xl w-full grid grid-cols-3 md:grid-cols-6 gap-1">
          {BADGE_CATEGORIES.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className={cn(
                "data-[state=active]:bg-white",
                "data-[state=active]:shadow-sm",
                "data-[state=active]:font-medium",
                "transition-all"
              )}
            >
              <category.icon 
                className={cn("mr-1", category.color)} 
                size={16} 
              />
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {BADGE_CATEGORIES.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            {/* Badges grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-600">배지 정보를 불러오는 중...</p>
              </div>
            ) : filteredBadges.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <BadgeX size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">해당 카테고리에 배지가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredBadges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Achievements explanation */}
      <div className="candy-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <h3 className="font-bold mb-2 dark:text-gray-100">배지를 얻는 방법</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
            <span className="dark:text-gray-300">저축 목표에 돈을 추가하거나 목표를 달성하세요.</span>
          </li>
          <li className="flex items-start">
            <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
            <span className="dark:text-gray-300">할일 목록에서 작업을 완료하세요.</span>
          </li>
          <li className="flex items-start">
            <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
            <span className="dark:text-gray-300">용돈 내역을 꾸준히 기록하세요.</span>
          </li>
          <li className="flex items-start">
            <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
            <span className="dark:text-gray-300">매일 앱에 접속하여 기록 스트릭을 유지하세요.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BadgesPage;
