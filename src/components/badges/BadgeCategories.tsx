
import { Award, BadgeCheck, BadgeX } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type BadgeCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
};

// Define badge categories with icons and colors
export const BADGE_CATEGORIES: BadgeCategory[] = [
  { id: 'all', name: '전체', icon: Award, color: 'text-purple-500', description: '모든 카테고리의 배지' },
  { id: 'savings', name: '저축', icon: BadgeCheck, color: 'text-blue-500', description: '저축 목표 달성 배지' },
  { id: 'expenses', name: '지출', icon: BadgeCheck, color: 'text-green-500', description: '지출 관리 배지' },
  { id: 'tasks', name: '할일', icon: BadgeCheck, color: 'text-amber-500', description: '할일 완료 배지' },
  { id: 'goals', name: '목표', icon: BadgeCheck, color: 'text-pink-500', description: '목표 달성 배지' },
  { id: 'activity', name: '활동', icon: BadgeCheck, color: 'text-indigo-500', description: '앱 활동 배지' },
];

interface BadgeCategoriesProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const BadgeCategories = ({ activeCategory, onCategoryChange }: BadgeCategoriesProps) => {
  return (
    <TabsList className="bg-gray-100 p-1 rounded-xl w-full grid grid-cols-3 md:grid-cols-6 gap-1">
      {BADGE_CATEGORIES.map(category => (
        <TooltipProvider key={category.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger 
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
            </TooltipTrigger>
            <TooltipContent>
              <p>{category.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </TabsList>
  );
};

export default BadgeCategories;
