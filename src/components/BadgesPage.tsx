
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useBadges } from '@/hooks/useBadges';
import BadgeCategories, { BADGE_CATEGORIES } from './badges/BadgeCategories';
import BadgeHeader from './badges/BadgeHeader';
import BadgeGrid from './badges/BadgeGrid';
import BadgeExplanation from './badges/BadgeExplanation';
import { supabase } from '@/integrations/supabase/client';
import MascotGuide from './MascotGuide';

const BadgesPage = () => {
  const { currentUser } = useUser();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Fetch badges using the custom hook
  const { data: badges = [], isLoading, refetch } = useBadges(currentUser?.id);
  
  // Debug: Check badge data in Supabase when component mounts
  useEffect(() => {
    const checkBadgesInDatabase = async () => {
      if (!currentUser?.id) return;
      
      try {
        console.log('🔍 데이터베이스에서 배지 데이터 확인 중...');
        
        // 1. 모든 배지 조회
        const { data: allBadges, error: badgesError } = await supabase
          .from('badges')
          .select('*');
        
        if (badgesError) {
          console.error('배지 테이블 조회 오류:', badgesError);
          return;
        }
        
        console.log('데이터베이스 배지 목록:', allBadges?.length, allBadges);
        
        // 2. 사용자 배지 조회
        const { data: userBadges, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', currentUser.id);
        
        if (userBadgesError) {
          console.error('사용자 배지 조회 오류:', userBadgesError);
          return;
        }
        
        console.log('사용자 배지 데이터:', userBadges?.length, userBadges);
        
        // 3. 사용자 작업 완료 수 확인
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', currentUser.id);
        
        if (tasksError) {
          console.error('작업 조회 오류:', tasksError);
          return;
        }
        
        const completedCount = tasks?.filter(t => t.status === 'completed').length || 0;
        console.log(`완료된 작업 수: ${completedCount}/${tasks?.length || 0}`);
        
        // 4. 배지 카테고리별 진행 상황 확인
        console.log('배지 카테고리별 진행 상황:');
        const categories = ['tasks', 'goals', 'activity'];
        
        for (const category of categories) {
          const categoryBadges = allBadges?.filter(b => b.category === category) || [];
          console.log(`- ${category} 카테고리: ${categoryBadges.length}개 배지`);
          
          for (const badge of categoryBadges) {
            const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
            console.log(`  - ${badge.name}: 필요=${badge.required_count}, 진행=${userBadge?.progress || 0}, 완료=${userBadge?.completed ? '예' : '아니오'}`);
          }
        }
      } catch (error) {
        console.error('배지 데이터 확인 중 오류:', error);
      }
    };
    
    checkBadgesInDatabase();
  }, [currentUser?.id]);
  
  // Filter badges by category
  const filteredBadges = badges.filter(badge => 
    activeCategory === 'all' || badge.category === activeCategory
  );
  
  // Count completed badges
  const completedCount = badges.filter(badge => badge.completed).length;
  const totalCount = badges.length;
  
  // 배지 획득율에 따른 마스코트 상태 결정
  const getMascotState = () => {
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    if (completionRate >= 75) return 'happy';
    if (completionRate <= 25) return 'hungry';
    if (completionRate === 100) return 'sleeping';
    return 'normal';
  };

  // 배지 획득에 따른 메시지 생성
  const getMascotMessage = () => {
    if (totalCount === 0) return '배지를 모아보세요!';
    
    const completionRate = (completedCount / totalCount) * 100;
    
    if (completionRate === 100) return '축하해요! 모든 배지를 획득했어요!';
    if (completionRate >= 75) return '거의 다 모았어요! 조금만 더 화이팅!';
    if (completionRate >= 50) return '절반 이상 모았네요! 잘 하고 있어요!';
    if (completionRate >= 25) return '배지 수집이 시작됐어요! 계속 도전해보세요!';
    return '새로운 배지에 도전해보세요!';
  };
  
  return (
    <div className="space-y-6 animate-slide-up">
      {/* 마스코트 가이드 */}
      <div className="flex justify-center mb-4">
        <MascotGuide 
          taskCompletion={totalCount > 0 ? (completedCount / totalCount) * 100 : 50}
          state={getMascotState()}
          message={getMascotMessage()}
        />
      </div>
      
      {/* Header */}
      <BadgeHeader 
        completedCount={completedCount} 
        totalCount={totalCount} 
      />
      
      {/* Category tabs */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <BadgeCategories 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
        
        {BADGE_CATEGORIES.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <BadgeGrid 
              badges={filteredBadges} 
              isLoading={isLoading} 
            />
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Achievements explanation */}
      <BadgeExplanation />
    </div>
  );
};

export default BadgesPage;
