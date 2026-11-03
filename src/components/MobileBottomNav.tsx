import React from 'react';
import { useApp } from '../context/AppContext';
import { Car, Layers, Flame, BarChart3, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: 'home' | 'simulator' | 'themes' | 'hardest' | 'stats' | 'admin' | 'billing';
  onNavigate: (view: 'home' | 'simulator' | 'themes' | 'hardest' | 'stats' | 'admin' | 'billing') => void;
  onOpenStripe: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenStripe
}) => {
  const { currentUser } = useApp();
  const isPro = currentUser?.subscriptionStatus === 'active_pro';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-14 px-2">
        
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            currentView === 'home' || currentView === 'simulator'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Car className="w-5 h-5 mb-0.5" />
          <span>Exame</span>
        </button>

        <button
          onClick={() => onNavigate('themes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            currentView === 'themes'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Temas</span>
        </button>

        <button
          onClick={() => onNavigate('hardest')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            currentView === 'hardest'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span>Difíceis</span>
        </button>

        <button
          onClick={() => onNavigate('stats')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            currentView === 'stats'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Estatísticas</span>
        </button>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
              currentView === 'admin' || currentView === 'billing'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span>Admin</span>
          </button>
        )}

      </div>
    </div>
  );
};
