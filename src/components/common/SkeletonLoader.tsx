import React from 'react';

export const SkeletonBox: React.FC<{
  className?: string;
  width?: string;
  height?: string;
}> = ({ className = '', width = 'w-full', height = 'h-4' }) => {
  return (
    <div
      className={`skeleton-box ${width} ${height} ${className}`}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-2xl glass-panel space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <SkeletonBox width="w-24" height="h-4" />
        <SkeletonBox width="w-8" height="h-8" className="rounded-xl" />
      </div>
      <SkeletonBox width="w-32" height="h-7" />
      <SkeletonBox width="w-20" height="h-3" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-3 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} width="flex-1" height="h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="flex gap-4 p-3.5 border-b border-slate-100 dark:border-slate-800/60"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <SkeletonBox
              key={cIdx}
              width="flex-1"
              height="h-4"
              className={cIdx === 0 ? 'opacity-80' : 'opacity-60'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
