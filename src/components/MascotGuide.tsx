
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type MascotProps = {
  className?: string;
  message?: string;
  showMessage?: boolean;
};

const MascotGuide = ({ className, message = "안녕하세요!", showMessage = true }: MascotProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setCurrentMessage(message);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [message]);

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
      
      {showMessage && (
        <div className={cn(
          "absolute top-0 right-0 transform translate-x-16 -translate-y-2",
          "bg-white p-3 rounded-xl rounded-bl-none shadow-md border border-gray-100",
          "text-sm max-w-[12rem] z-10 font-medium text-gray-700",
          "transition-all duration-500",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          {currentMessage}
          <div className="absolute -left-2 bottom-0 w-4 h-4 bg-white border-l border-b border-gray-100 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default MascotGuide;
