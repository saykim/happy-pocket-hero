import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Heart, Star, CarrotIcon, Zap } from "lucide-react";

type MascotState = 'normal' | 'happy' | 'sleeping' | 'hungry';

type MascotProps = {
  className?: string;
  message?: string;
  taskCompletion?: number; // 0-100 범위의 할일 완료율
  state?: MascotState;
};

const MascotGuide = ({ className, message, taskCompletion = 50, state = 'normal' }: MascotProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentState, setCurrentState] = useState<MascotState>(state);
  const [mood, setMood] = useState(50); // 0-100 범위의 기분 상태
  
  // 캐릭터 상태를 작업 완료율에 따라 자동으로 설정
  useEffect(() => {
    if (taskCompletion >= 80) {
      setCurrentState('happy');
      setMood(90);
    } else if (taskCompletion < 20) {
      setCurrentState('hungry');
      setMood(30);
    } else {
      setCurrentState('normal');
      setMood(taskCompletion);
    }
  }, [taskCompletion]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 각 상태에 따른 메시지 결정
  const getDefaultMessage = () => {
    switch (currentState) {
      case 'happy':
        return '잘하고 있어요! 계속 진행하세요!';
      case 'hungry':
        return '할 일을 완료하면 더 행복해질 거예요!';
      case 'sleeping':
        return 'Zzz... (오늘은 충분히 했어요)';
      default:
        return '오늘의 할 일을 확인해보세요!';
    }
  };

  // 상태에 따른 색상 변경
  const getMascotColor = () => {
    switch (currentState) {
      case 'happy':
        return '#FFCCEE';
      case 'hungry':
        return '#FFEEDD';
      case 'sleeping':
        return '#DDDDFF';
      default:
        return '#FFC0CB';
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "relative w-20 h-20 transition-all duration-700",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        "animate-float"
      )}>
        {/* 캐릭터 SVG - 상태에 따라 표정과 색상이 변함 */}
        <svg 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="mascot w-full h-full"
        >
          <circle cx="100" cy="100" r="85" fill={getMascotColor()} fillOpacity="0.3" />
          <path d="M65 85C65 75.059 73.0589 67 83 67H117C126.941 67 135 75.059 135 85V135H65V135Z" fill="#FFEEEE" />
          <path d="M65 125V135H135V125C135 125 120 135 100 135C80 135 65 125 65 125Z" fill="#FFD8B8" />

          {/* 눈 - 상태별로 다름 */}
          {currentState === 'sleeping' ? (
            // 잠자는 눈 (X 모양)
            <>
              <path d="M78 95L88 105M78 105L88 95" stroke="#333333" strokeWidth="2" />
              <path d="M112 95L122 105M112 105L122 95" stroke="#333333" strokeWidth="2" />
            </>
          ) : (
            // 기본 눈
            <>
              <circle cx="83" cy="100" r="8" fill="white" />
              <circle cx="117" cy="100" r="8" fill="white" />
              <circle cx="83" cy="100" r="4" fill="#333333" />
              <circle cx="117" cy="100" r="4" fill="#333333" />
            </>
          )}
          
          {/* 귀 */}
          <path d="M60 67C55 57 45 62 45 67" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          <path d="M140 67C145 57 155 62 155 67" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          
          {/* 입 - 상태별로 다름 */}
          {currentState === 'happy' ? (
            // 행복한 웃음
            <path d="M90 115C90 120 100 125 100 120C100 125 110 120 110 115" stroke="#FF9494" strokeWidth="3" strokeLinecap="round" />
          ) : currentState === 'hungry' ? (
            // 배고픈 표정
            <path d="M90 120H110" stroke="#FF9494" strokeWidth="2" strokeLinecap="round" />
          ) : currentState === 'sleeping' ? (
            // 자는 표정 (작은 원)
            <circle cx="100" cy="115" r="3" fill="#FF9494" />
          ) : (
            // 기본 표정
            <path d="M90 115H110M90 115C90 120 100 125 100 115M110 115C110 120 100 125 100 115" stroke="#FF9494" strokeWidth="3" strokeLinecap="round" />
          )}
          
          {/* 상태별 아이콘 표시 */}
          {currentState === 'happy' && (
            <g transform="translate(130, 70) scale(0.7)">
              <circle cx="10" cy="10" r="10" fill="#FFDD00" />
              <path d="M6 10L9 13L14 7" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          {currentState === 'hungry' && (
            <g transform="translate(130, 70) scale(0.7)">
              <circle cx="10" cy="10" r="10" fill="#FFA500" />
              <path d="M7 13L13 7M7 7L13 13" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
          {currentState === 'sleeping' && (
            <g transform="translate(130, 70) scale(0.7)">
              <circle cx="10" cy="10" r="10" fill="#9999FF" />
              <path d="M6 12H14M10 8L14 12" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </svg>
      </div>
      
      {/* 상태 표시 - 하트 아이콘 */}
      <div className="absolute -top-2 -right-2 flex space-x-1">
        <div className="bg-white rounded-full p-1 shadow-md">
          <Heart 
            size={16} 
            className="text-red-400" 
            fill={mood > 50 ? "rgba(248, 113, 113, 0.8)" : "none"} 
          />
        </div>
      </div>
      
      {/* 메시지 표시 */}
      {(message || getDefaultMessage()) && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-sm max-w-[200px] text-center z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
          {message || getDefaultMessage()}
        </div>
      )}
    </div>
  );
};

export default MascotGuide;
