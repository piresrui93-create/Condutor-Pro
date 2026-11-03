import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Innovative geometric logo mark: Horizon road vanishing point combined with steering apex */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm transition-transform hover:scale-105`}>
        <svg viewBox="0 0 40 40" fill="none" className="w-4/5 h-4/5" xmlns="http://www.w3.org/2000/svg">
          {/* Steering wheel outer ring */}
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.85" />
          {/* Horizon line */}
          <line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.4" />
          {/* Perspective road lanes converging to center */}
          <path d="M14 31L19 20M26 31L21 20" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          {/* Center dash markings */}
          <line x1="20" y1="28" x2="20" y2="24" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          {/* Steering apex hub */}
          <circle cx="20" cy="20" r="3" fill="#10b981" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight leading-none ${textSizes[size]}`}>
          <span className="text-slate-900 dark:text-white">Condutor</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black">PRO</span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1">
            Simulador Oficial IMT
          </span>
        )}
      </div>
    </div>
  );
};
