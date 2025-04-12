
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type MascotProps = {
  className?: string;
  message?: string; // Optional message prop
};

const MascotGuide = ({ className, message }: MascotProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "relative w-20 h-20 transition-all duration-700",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        "animate-float"
      )}>
        {/* Cat mascot SVG */}
        <svg 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="mascot w-full h-full"
        >
          <circle cx="100" cy="100" r="85" fill="#FFC0CB" fillOpacity="0.3" />
          <path d="M65 85C65 75.059 73.0589 67 83 67H117C126.941 67 135 75.059 135 85V135H65V85Z" fill="#FFEEEE" />
          <path d="M65 125V135H135V125C135 125 120 135 100 135C80 135 65 125 65 125Z" fill="#FFD8B8" />
          <circle cx="83" cy="100" r="8" fill="white" />
          <circle cx="117" cy="100" r="8" fill="white" />
          <circle cx="83" cy="100" r="4" fill="#333333" />
          <circle cx="117" cy="100" r="4" fill="#333333" />
          <path d="M60 67C55 57 45 62 45 67" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          <path d="M140 67C145 57 155 62 155 67" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          <path d="M90 115H110M90 115C90 120 100 125 100 115M110 115C110 120 100 125 100 115" stroke="#FF9494" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      
      {/* Display message if provided */}
      {message && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-sm max-w-[200px] text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
          {message}
        </div>
      )}
    </div>
  );
};

export default MascotGuide;
