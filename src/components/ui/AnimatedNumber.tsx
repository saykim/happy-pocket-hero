
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  formatOptions?: Intl.NumberFormatOptions;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
};

const AnimatedNumber = ({
  value,
  formatOptions = { style: "decimal" },
  className,
  prefix = "",
  suffix = "",
  duration = 500,
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    previousValueRef.current = displayValue;
    startTimeRef.current = null;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animateNumber = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      const nextValue = 
        previousValueRef.current + 
        (value - previousValueRef.current) * easeOutQuart(progress);
      
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateNumber);
      } else {
        setDisplayValue(value); // Ensure final value is exact
      }
    };

    animationRef.current = requestAnimationFrame(animateNumber);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // Easing function for smoother animation
  const easeOutQuart = (x: number): number => {
    return 1 - Math.pow(1 - x, 4);
  };

  const formattedValue = new Intl.NumberFormat('ko-KR', formatOptions).format(
    Math.floor(displayValue)
  );

  return (
    <span className={cn("tabular-nums transition-colors", className)}>
      {prefix}
      {formattedValue}
      {suffix}
      <span className="inline-block animate-pulse-soft">
        {displayValue !== value && "..."}
      </span>
    </span>
  );
};

export default AnimatedNumber;
