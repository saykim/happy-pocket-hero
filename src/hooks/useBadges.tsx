
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BadgeType } from '@/components/BadgeCard';

export const useBadges = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get all badges with explicit typing for the response
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');
      
      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
        return [];
      }
      
      // Get user's badge progress with explicit typing
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);
      
      if (userBadgesError) {
        console.error('Error fetching user badges:', userBadgesError);
        return [];
      }
      
      console.log('Fetched badges:', allBadges.length);
      console.log('Fetched user badges:', userBadges?.length || 0);
      
      // Log each user badge for debugging
      if (userBadges && userBadges.length > 0) {
        console.log('User badges details:', userBadges.map(ub => ({
          badge_id: ub.badge_id,
          progress: ub.progress,
          completed: ub.completed
        })));
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
    // Add refetchInterval to periodically check for badge updates
    refetchInterval: 15000, // Check every 15 seconds
  });
};
