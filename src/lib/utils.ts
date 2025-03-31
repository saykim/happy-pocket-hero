import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 사용자의 배지 진행 상황을 업데이트하는 함수
 * @param userId 사용자 ID
 * @param category 배지 카테고리 (예: 'goals', 'tasks', 'savings')
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

    const updatedBadges = [];

    // 2. 각 배지에 대해 사용자 진행 상황 업데이트
    for (const badge of badges) {
      console.log(`배지 처리 시작: ID=${badge.id}, 이름=${badge.name}, 필요 개수=${badge.required_count}`);
      
      try {
        // 2.1 사용자의 배지 진행 상황 조회
        const { data: userBadge, error: userBadgeError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .eq('badge_id', badge.id)
          .maybeSingle();
        
        if (userBadgeError) {
          console.error(`사용자 배지 조회 중 오류(배지 ID: ${badge.id}):`, userBadgeError);
          continue;
        }

        // 2.2 사용자 배지 레코드가 없으면 생성, 있으면 업데이트
        if (!userBadge) {
          // 새 배지 진행 상황 레코드 생성
          const progress = increment;
          const completed = progress >= badge.required_count;
          console.log(`신규 배지 생성 - 진행도 계산: ${progress} >= ${badge.required_count} = ${completed ? '완료' : '미완료'}`);
          
          const { data: insertData, error: insertError } = await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: badge.id,
              progress: progress,
              completed: completed,
              earned_at: completed ? new Date().toISOString() : null
            })
            .select();
          
          if (insertError) {
            console.error(`배지 생성 중 오류(배지 ID: ${badge.id}):`, insertError);
          } else {
            console.log(`배지 생성 성공: 배지=${badge.name}, 진행도=${progress}, 완료=${completed ? '예' : '아니오'}`);
            
            if (completed) {
              console.log(`🎉 축하합니다! '${badge.name}' 배지를 획득했습니다!`);
              updatedBadges.push({ id: badge.id, name: badge.name, completed: true });
            }
          }
        } else if (!userBadge.completed) {
          // 배지가 완료되지 않은 경우에만 업데이트
          const newProgress = userBadge.progress + increment;
          const completed = newProgress >= badge.required_count;
          console.log(`기존 배지 업데이트 - 진행도 계산: ${userBadge.progress} + ${increment} = ${newProgress} >= ${badge.required_count} = ${completed ? '완료' : '미완료'}`);
          
          const { data: updateData, error: updateError } = await supabase
            .from('user_badges')
            .update({
              progress: newProgress,
              completed: completed,
              earned_at: completed ? new Date().toISOString() : null
            })
            .eq('id', userBadge.id)
            .select();
          
          if (updateError) {
            console.error(`배지 업데이트 중 오류(배지 ID: ${badge.id}):`, updateError);
          } else {
            console.log(`배지 업데이트 성공: 배지=${badge.name}, 이전=${userBadge.progress}, 현재=${newProgress}, 완료=${completed ? '예' : '아니오'}`);
            
            if (completed) {
              console.log(`🎉 축하합니다! '${badge.name}' 배지를 획득했습니다!`);
              updatedBadges.push({ id: badge.id, name: badge.name, completed: true });
            }
          }
        } else {
          console.log(`배지 이미 완료됨: ${badge.name}, 진행도=${userBadge.progress}/${badge.required_count}`);
        }
      } catch (badgeError) {
        console.error(`배지 처리 중 예외 발생(배지 ID: ${badge.id}):`, badgeError);
      }
    }

    return { success: true, updatedBadges };
  } catch (error) {
    console.error('배지 업데이트 중 예상치 못한 오류:', error);
    return { success: false, error };
  }
}

/**
 * 특정 카테고리의 배지 진행 상황을 초기화하는 함수 (디버깅용)
 * @param userId 사용자 ID
 * @param category 배지 카테고리 (전체 초기화하려면 undefined)
 * @returns 초기화 결과
 */
export async function resetBadgeProgress(
  userId: string,
  category?: string
) {
  try {
    let query = supabase
      .from('user_badges')
      .delete()
      .eq('user_id', userId);
      
    // 특정 카테고리만 초기화하는 경우
    if (category) {
      // 먼저 해당 카테고리의 배지 ID들을 가져옴
      const { data: badges } = await supabase
        .from('badges')
        .select('id')
        .eq('category', category);
        
      if (badges && badges.length > 0) {
        const badgeIds = badges.map(b => b.id);
        // 해당 배지 ID들에 해당하는 user_badges만 삭제
        query = query.in('badge_id', badgeIds);
      } else {
        return { success: false, message: '해당 카테고리의 배지가 없습니다.' };
      }
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('배지 초기화 중 오류:', error);
      return { success: false, error };
    }
    
    console.log(`사용자(${userId})의 ${category ? category + ' 카테고리' : '모든'} 배지 초기화 완료`);
    return { success: true };
  } catch (error) {
    console.error('배지 초기화 중 예상치 못한 오류:', error);
    return { success: false, error };
  }
}

/**
 * 특정 카테고리의 배지 진행 상황을 디버깅하기 위한 함수
 * @param userId 사용자 ID
 * @param category 배지 카테고리 (생략하면 모든 카테고리)
 * @returns 배지 진행 상황 데이터
 */
export async function debugBadgeProgress(
  userId: string,
  category?: string
) {
  try {
    // 1. 배지 정보 쿼리
    let badgesQuery = supabase.from('badges').select('*');
    if (category) {
      badgesQuery = badgesQuery.eq('category', category);
    }
    
    const { data: badges, error: badgesError } = await badgesQuery;
    
    if (badgesError) {
      console.error('배지 조회 중 오류:', badgesError);
      return { success: false, error: badgesError };
    }
    
    // 2. 사용자의 배지 진행 상황 쿼리
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);
      
    if (userBadgesError) {
      console.error('사용자 배지 조회 중 오류:', userBadgesError);
      return { success: false, error: userBadgesError };
    }
    
    // 3. 데이터 결합하여 디버그 정보 생성
    const badgeProgress = badges?.map(badge => {
      const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
      return {
        id: badge.id,
        name: badge.name,
        category: badge.category,
        required: badge.required_count,
        current: userBadge?.progress || 0,
        completed: userBadge?.completed || false,
        earned_at: userBadge?.earned_at,
        percentage: userBadge 
          ? Math.round((userBadge.progress / badge.required_count) * 100) 
          : 0
      };
    });
    
    console.table(badgeProgress);
    return { success: true, data: badgeProgress };
  } catch (error) {
    console.error('배지 디버깅 중 예상치 못한 오류:', error);
    return { success: false, error };
  }
}
