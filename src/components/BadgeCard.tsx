
import { useState } from 'react';
import { Badge as BadgeIcon, BadgePlus, BadgeCheck, BadgeDollarSign, CheckCheck, Trophy, Award, Star, BadgeIndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type BadgeType = {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  required_count: number;
  completed: boolean;
  category: string;
};

const ICON_MAP: Record<string, React.ElementType> = {
  'badge-plus': BadgePlus,
  'badge-check': BadgeCheck,
  'badge-dollar-sign': BadgeDollarSign,
  'check-check': CheckCheck,
  'trophy': Trophy,
  'award': Award,
  'star': Star,
  'badge-indian-rupee': BadgeIndianRupee,
  'default': BadgeIcon
};

interface BadgeCardProps {
  badge: BadgeType;
}

const BadgeCard = ({ badge }: BadgeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const Icon = ICON_MAP[badge.icon] || ICON_MAP.default;
  const progress = Math.min(100, Math.floor((badge.progress / badge.required_count) * 100));
  
  // Apply different styles based on completion status
  const containerClasses = cn(
    "candy-card p-4 flex flex-col items-center transition-all duration-300",
    badge.completed 
      ? "bg-gradient-to-b from-amber-50 to-amber-100 border-amber-200 hover:shadow-md" 
      : "bg-white hover:bg-gray-50",
    isHovered && "transform scale-105"
  );
  
  const iconClasses = cn(
    "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all",
    badge.completed 
      ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-white" 
      : "bg-gray-200 text-gray-400"
  );
  
  return (
    <div 
      className={containerClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={iconClasses}>
        <Icon size={32} className={badge.completed ? "animate-pulse-slow" : ""} />
      </div>
      
      <h3 className="font-semibold text-center">
        {badge.name}
      </h3>
      
      {badge.completed ? (
        <Badge variant="outline" className="mt-2 bg-green-100 text-green-800 border-green-200">
          달성 완료!
        </Badge>
      ) : (
        <>
          <p className="text-xs text-gray-500 text-center mt-1 px-2">
            {badge.description}
          </p>
          
          <div className="w-full mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>{badge.progress}</span>
              <span>{badge.required_count}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BadgeCard;
