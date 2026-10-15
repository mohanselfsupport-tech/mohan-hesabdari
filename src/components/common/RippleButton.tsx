import React, { useState } from 'react';
import { motion } from 'motion/react';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'ghost' | 'danger';
  className?: string;
  glow?: boolean;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  glow = false,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handlePointerDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now() + Math.random(),
    };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    if (onClick) {
      onClick(e);
    }
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80',
    emerald:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30',
    amber:
      'bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold shadow-md shadow-rose-600/20',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      onPointerDown={handlePointerDown}
      className={`relative overflow-hidden cursor-pointer rounded-xl transition-all duration-300 select-none ${variantStyles} ${className} ${
        glow ? 'ring-2 ring-amber-400/30' : ''
      }`}
      {...(props as any)}
    >
      {/* Ripple elements */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
          }}
          className="absolute rounded-full bg-white/25 pointer-events-none animate-ping duration-600"
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
