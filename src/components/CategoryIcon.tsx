
import { 
  PiggyBank, 
  ShoppingBag, 
  Gift, 
  IceCream, 
  GamepadIcon, 
  BookIcon, 
  Bus, 
  Coffee,
  Banknote,
  PartyPopper 
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryType = 
  | "저축" 
  | "쇼핑" 
  | "선물" 
  | "간식" 
  | "게임" 
  | "책" 
  | "교통" 
  | "음료" 
  | "용돈" 
  | "기타";

const categoryConfig: Record<CategoryType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  "저축": { 
    icon: PiggyBank, 
    color: "text-purple-600", 
    bgColor: "bg-candy-purple" 
  },
  "쇼핑": { 
    icon: ShoppingBag, 
    color: "text-pink-600", 
    bgColor: "bg-candy-pink" 
  },
  "선물": { 
    icon: Gift, 
    color: "text-red-500", 
    bgColor: "bg-red-100" 
  },
  "간식": { 
    icon: IceCream, 
    color: "text-amber-500", 
    bgColor: "bg-amber-100" 
  },
  "게임": { 
    icon: GamepadIcon, 
    color: "text-blue-600", 
    bgColor: "bg-candy-blue" 
  },
  "책": { 
    icon: BookIcon, 
    color: "text-emerald-600", 
    bgColor: "bg-candy-green" 
  },
  "교통": { 
    icon: Bus, 
    color: "text-sky-600", 
    bgColor: "bg-sky-100" 
  },
  "음료": { 
    icon: Coffee, 
    color: "text-amber-700", 
    bgColor: "bg-amber-50" 
  },
  "용돈": { 
    icon: Banknote, 
    color: "text-emerald-600", 
    bgColor: "bg-emerald-100" 
  },
  "기타": { 
    icon: PartyPopper, 
    color: "text-violet-500", 
    bgColor: "bg-violet-100" 
  }
};

type CategoryIconProps = {
  category: CategoryType;
  className?: string;
  size?: number;
  withBackground?: boolean;
  iconClassName?: string;
};

const CategoryIcon = ({ 
  category, 
  className, 
  size = 24, 
  withBackground = true,
  iconClassName
}: CategoryIconProps) => {
  const config = categoryConfig[category] || categoryConfig["기타"];
  const Icon = config.icon;

  if (withBackground) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          config.bgColor,
          className
        )}
        style={{ width: `${size + 16}px`, height: `${size + 16}px` }}
      >
        <Icon size={size} className={cn(config.color, iconClassName)} />
      </div>
    );
  }

  return <Icon size={size} className={cn(config.color, className, iconClassName)} />;
};

export default CategoryIcon;
