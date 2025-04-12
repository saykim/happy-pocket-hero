
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Updates badge progress when tasks are completed
 */
export const updateBadgesOnTaskCompletion = async (
  userId: string | undefined,
  completedCount: number,
  allTasksCompleted: boolean,
  tasksLength: number,
  queryClient: ReturnType<typeof useQueryClient>
) => {
  if (!userId) return;
  
  try {
    console.log("🏆 할일 완료 감지! 배지 업데이트 중...");
    
    // 1. Update task badge progress for every task completion
    const tasksResult = await updateUserBadgeProgress(userId, 'tasks');
    console.log("할일 배지 업데이트 결과:", tasksResult);
    
    // 2. Update activity badge progress for task completion
    const activityResult = await updateUserBadgeProgress(userId, 'activity');
    console.log("활동 배지 업데이트 결과:", activityResult);
    
    // If all tasks are completed, give special bonus
    if (allTasksCompleted) {
      console.log("🎯 모든 할일 완료! 추가 배지 업데이트 중...");
      
      // 특별 보상: 모든 작업을 완료하면 추가 배지 포인트 제공
      await updateUserBadgeProgress(userId, 'activity', completedCount);
      console.log(`모든 할일 완료 보너스: 활동 배지에 ${completedCount}점 추가`);
    }
    
    // Refresh badges data to show new earned badges
    await queryClient.invalidateQueries({ queryKey: ['badges', userId] });
    console.log("배지 데이터 새로고침 완료");
    
  } catch (badgeError) {
    console.error('배지 업데이트 중 오류:', badgeError);
  }
};

/**
 * Check all completed tasks and update badges on initial load
 */
export const checkCompletedTasksForBadges = async (
  userId: string | undefined,
  tasks: any[],
  queryClient: ReturnType<typeof useQueryClient>
) => {
  if (!userId || tasks.length === 0) return;
  
  // Count completed tasks
  const completedCount = tasks.filter(task => task.completed).length;
  console.log(`현재 완료된 작업: ${completedCount}/${tasks.length}`);
  
  // Only proceed if there are completed tasks
  if (completedCount > 0) {
    try {
      // Update badge progress for tasks category based on completion count
      await updateUserBadgeProgress(userId, 'tasks', completedCount);
      console.log(`작업 완료 배지 업데이트: ${completedCount}개 적용됨`);
      
      // Update activity badge progress
      await updateUserBadgeProgress(userId, 'activity', completedCount);
      console.log(`활동 배지 업데이트: ${completedCount}개 적용됨`);
      
      // If all tasks are completed, give special bonus
      if (completedCount === tasks.length && tasks.length > 0) {
        console.log("🌟 모든 작업이 완료되었습니다! 특별 보너스 지급");
        
        // Give additional bonus points for completing all tasks
        await updateUserBadgeProgress(userId, 'activity', tasks.length);
        console.log(`전체 완료 보너스: 활동 배지에 ${tasks.length}점 추가`);
      }
      
      // Refresh badges data
      await queryClient.invalidateQueries({ queryKey: ['badges', userId] });
    } catch (error) {
      console.error('배지 업데이트 중 오류:', error);
    }
  }
};

// Re-export the function from utils.ts
export { updateUserBadgeProgress } from '@/lib/utils';
