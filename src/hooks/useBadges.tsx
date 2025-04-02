
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BadgeType } from '@/components/BadgeCard';

export const useBadges = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching badges for user:', userId);
      
      // Get all badges with explicit typing for the response
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');
      
      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
        throw new Error(`배지 조회 중 오류: ${badgesError.message}`);
      }
      
      // Get user's badge progress with explicit typing
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);
      
      if (userBadgesError) {
        console.error('Error fetching user badges:', userBadgesError, 'for user:', userId);
        // Don't throw here, just return what we can
      }
      
      console.log('Fetched badges:', allBadges?.length || 0);
      console.log('Fetched user badges:', userBadges?.length || 0);
      
      // Log each user badge for debugging
      if (userBadges && userBadges.length > 0) {
        console.log('User badges details:', userBadges.map(ub => ({
          badge_id: ub.badge_id,
          progress: ub.progress,
          completed: ub.completed
        })));
      } else {
        console.log('No user badges found for user ID:', userId);
      }
      
      // Combine the data with proper type checking
      return allBadges.map(badge => {
        const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          required_count: badge.required_count,
          category: badge.category,
          progress: userBadge?.progress || 0,
          completed: userBadge?.completed || false
        } as BadgeType;
      });
    },
    enabled: !!userId,
    // Check more frequently for updates
    refetchInterval: 5000, // Check every 5 seconds
    staleTime: 3000, // Consider data stale after 3 seconds
  });
};
