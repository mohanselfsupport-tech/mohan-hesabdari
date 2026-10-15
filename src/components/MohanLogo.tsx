import React from 'react';

interface MohanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'horizontal';
  className?: string;
  showSubtitle?: boolean;
}

export const MohanLogo: React.FC<MohanLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  className = '',
  showSubtitle = true,
}) => {
  // Dimensions mapping
  const iconDimensions = {
    sm: 32,
    md: 42,
    lg: 64,
    xl: 96,
  }[size];

  const titleSizes = {
    sm: 'text-sm font-bold',
    md: 'text-lg font-bold tracking-wider',
    lg: 'text-2xl font-bold tracking-widest',
    xl: 'text-3xl font-extrabold tracking-widest',
  }[size];

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size];

  // SVG Luxury Gold Emblem
  const Emblem = (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={iconDimensions}
        height={iconDimensions}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)] transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Rich metallic gold linear gradients */}
          <linearGradient id="goldGradientRing" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="25%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#F5DF7C" />
            <stop offset="75%" stopColor="#AA7C11" />
            <stop offset="100%" stopColor="#E6C657" />
          </linearGradient>

          <linearGradient id="goldGradientApex" x1="50" y1="60" x2="150" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7C2" />
            <stop offset="35%" stopColor="#DFB738" />
            <stop offset="70%" stopColor="#AA7C11" />
            <stop offset="100%" stopColor="#6C4D04" />
          </linearGradient>

          <linearGradient id="goldGradientBase" x1="40" y1="140" x2="160" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DFB738" />
            <stop offset="50%" stopColor="#FFF7C2" />
            <stop offset="100%" stopColor="#AA7C11" />
          </linearGradient>

          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Ring with subtle rim */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="url(#goldGradientRing)"
          strokeWidth="7"
          className="transition-all"
        />

        {/* Inner subtle rim accent */}
        <circle
          cx="100"
          cy="100"
          r="82"
          stroke="#FFF2B2"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />

        {/* Geometric Sharp Arrowhead / Triangle Apex */}
        {/* Left wing of apex */}
        <path
          d="M100 58 L142 128 L114 128 L100 95 L86 128 L58 128 Z"
          fill="url(#goldGradientApex)"
          stroke="#FFE899"
          strokeWidth="0.5"
        />

        {/* Dynamic Inner Shade for faceted metallic 3D feel */}
        <path
          d="M100 58 L100 95 L114 128 L142 128 Z"
          fill="#000000"
          fillOpacity="0.12"
        />

        {/* Horizontal Sharp Baseline Bar */}
        <path
          d="M50 142 L150 142 L143 149 L57 149 Z"
          fill="url(#goldGradientBase)"
          stroke="#FFE899"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{Emblem}</div>;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        {Emblem}
        <div className="flex flex-col items-center">
          <span className={`font-serif tracking-[0.25em] bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 bg-clip-text text-transparent font-extrabold ${titleSizes}`}>
            MOHAN
          </span>
          {showSubtitle && (
            <span className={`text-slate-600 dark:text-slate-300 font-bold mt-0.5 ${subtitleSizes}`}>
              برنامه حسابداری موهان
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default for Topbar and Sidebar)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {Emblem}
      <span className={`font-bold text-slate-900 dark:text-white ${titleSizes} whitespace-nowrap`}>
        برنامه حسابداری موهان
      </span>
    </div>
  );
};
