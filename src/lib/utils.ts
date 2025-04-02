
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 사용자의 배지 진행 상황을 업데이트하는 함수
 * @param userId 사용자 ID
 * @param category 배지 카테고리 (예: 'goals', 'tasks', 'activity')
 * @param increment 증가시킬 값
 * @returns 업데이트 결과
 */
export async function updateUserBadgeProgress(
  userId: string,
  category: string,
  increment: number = 1
) {
  console.log(`배지 업데이트 시도: 사용자=${userId}, 카테고리=${category}, 증가량=${increment}`);
  try {
    if (!userId) {
      console.error('사용자 ID가 제공되지 않았습니다.');
      return { success: false, error: '사용자 ID가 필요합니다.' };
    }

    // 1. 해당 카테고리의 배지 조회
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('category', category);
    
    if (badgesError) {
      console.error('배지 조회 중 오류:', badgesError);
      return { success: false, error: badgesError };
    }

    console.log(`카테고리 '${category}'의 배지 개수:`, badges?.length || 0);
    
    if (!badges || badges.length === 0) {
      console.warn(`[경고] 카테고리 '${category}'에 해당하는 배지가 없습니다!`);
      return { success: true, message: '해당 카테고리의 배지가 없습니다.' };
    }

    // 2. 각 배지에 대해 사용자 진행 상황 업데이트
    const updateResults = [];
    for (const badge of badges) {
      console.log(`배지 처리: ID=${badge.id}, 이름=${badge.name}, 필요 개수=${badge.required_count}`);
      
      // 2.1 사용자의 배지 진행 상황 조회
      const { data: userBadge, error: userBadgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .maybeSingle();
      
      if (userBadgeError) {
        console.error('사용자 배지 조회 중 오류:', userBadgeError);
        updateResults.push({ badge: badge.name, error: userBadgeError });
        continue;
      }

      // 2.2 사용자 배지 레코드가 없으면 생성, 있으면 업데이트
      if (!userBadge) {
        // 새 배지 진행 상황 레코드 생성
        const newProgress = increment;
        const completed = newProgress >= badge.required_count;
        
        console.log(`새 배지 생성: 사용자=${userId}, 배지=${badge.id}, 진행도=${newProgress}/${badge.required_count}`);
        
        const { data: insertData, error: insertError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            progress: newProgress,
            completed: completed,
            earned_at: completed ? new Date().toISOString() : null
          })
          .select();
        
        if (insertError) {
          console.error('배지 생성 중 오류:', insertError);
          updateResults.push({ badge: badge.name, error: insertError });
        } else {
          console.log(`배지 생성 성공: 진행도=${newProgress}, 완료=${completed ? '예' : '아니오'}`);
          
          if (completed) {
            console.log(`🎉 축하합니다! '${badge.name}' 배지를 획득했습니다!`);
          }
          
          updateResults.push({ 
            badge: badge.name, 
            success: true, 
            completed,
            progress: newProgress
          });
        }
      } else {
        // 이미 존재하는 배지 업데이트
        const newProgress = userBadge.progress + increment;
        const wasCompleted = userBadge.completed;
        const nowCompleted = newProgress >= badge.required_count;
        const newlyCompleted = !wasCompleted && nowCompleted;
        
        console.log(`배지 업데이트: ID=${userBadge.id}, 이전=${userBadge.progress}, 신규=${newProgress}/${badge.required_count}, 완료=${nowCompleted ? '예' : '아니오'}`);
        
        // 배지 진행 상황 업데이트
        const { data: updateData, error: updateError } = await supabase
          .from('user_badges')
          .update({
            progress: newProgress,
            completed: nowCompleted,
            // 이전에 완료되지 않았고 지금 완료된 경우에만 earned_at 업데이트
            earned_at: newlyCompleted ? new Date().toISOString() : userBadge.earned_at
          })
          .eq('id', userBadge.id)
          .select();
        
        if (updateError) {
          console.error('배지 업데이트 중 오류:', updateError);
          updateResults.push({ badge: badge.name, error: updateError });
        } else {
          console.log(`배지 업데이트 성공: 이전=${userBadge.progress}, 현재=${newProgress}, 완료=${nowCompleted ? '예' : '아니오'}`);
          
          // 새로 완료된 배지인 경우 축하 메시지 표시
          if (newlyCompleted) {
            console.log(`🎉 축하합니다! '${badge.name}' 배지를 획득했습니다!`);
          }
          
          updateResults.push({ 
            badge: badge.name, 
            success: true,
            newlyCompleted: newlyCompleted,
            previousProgress: userBadge.progress,
            currentProgress: newProgress
          });
        }
      }
    }

    return { success: true, results: updateResults };
  } catch (error) {
    console.error('배지 업데이트 중 예상치 못한 오류:', error);
    return { success: false, error };
  }
}
