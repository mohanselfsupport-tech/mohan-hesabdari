import React, { useEffect, useState } from 'react';
import { toPersianDigits } from '../../utils/formatters';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1200,
  formatter,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(end);
      }
    };

    const animId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  const formatted = formatter
    ? formatter(displayValue)
    : toPersianDigits(displayValue.toLocaleString('fa-IR'));

  return <span className={`tabular-nums transition-all ${className}`}>{formatted}</span>;
};
