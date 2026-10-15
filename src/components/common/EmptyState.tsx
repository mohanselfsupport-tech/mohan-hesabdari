import React from 'react';
import { motion } from 'motion/react';
import { RippleButton } from './RippleButton';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl glass-panel border border-dashed border-slate-300 dark:border-slate-800 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-amber-500/20 to-yellow-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner"
      >
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 dark:text-amber-400" />
        <span className="absolute -inset-1 rounded-2xl bg-amber-400/10 blur-md -z-10 pointer-events-none" />
      </motion.div>

      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <RippleButton
          variant="primary"
          onClick={onAction}
          className="px-4 py-2.5 text-xs"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          <span>{actionLabel}</span>
        </RippleButton>
      )}
    </div>
  );
};
