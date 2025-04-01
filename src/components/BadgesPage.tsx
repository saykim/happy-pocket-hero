
import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useBadges } from '@/hooks/useBadges';
import BadgeCategories, { BADGE_CATEGORIES } from './badges/BadgeCategories';
import BadgeHeader from './badges/BadgeHeader';
import BadgeGrid from './badges/BadgeGrid';
import BadgeExplanation from './badges/BadgeExplanation';

const BadgesPage = () => {
  const { currentUser } = useUser();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Fetch badges using the custom hook
  const { data: badges = [], isLoading } = useBadges(currentUser?.id);
  
  // Filter badges by category
  const filteredBadges = badges.filter(badge => 
    activeCategory === 'all' || badge.category === activeCategory
  );
  
  // Count completed badges
  const completedCount = badges.filter(badge => badge.completed).length;
  const totalCount = badges.length;
  
  return (
    <div className="space-y-6 animate-slide-up">
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
