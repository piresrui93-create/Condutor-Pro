import React from 'react';
import { BrandLogo } from './BrandLogo';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Sparkles, Moon, Sun, User as UserIcon, LogOut, ArrowRightLeft } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'simulator' | 'themes' | 'hardest' | 'stats' | 'admin' | 'billing';
  onNavigate: (view: 'home' | 'simulator' | 'themes' | 'hardest' | 'stats' | 'admin' | 'billing') => void;
  onOpenAuth: () => void;
  onOpenStripe: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenStripe,
  isDarkMode,
  onToggleDarkMode
}) => {
  const { currentUser, logout, switchRole } = useApp();

  const isPro = currentUser?.subscriptionStatus === 'active_pro';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        
        {/* Zone 1: Single Brand Wordmark */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center text-left hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
          <BrandLogo size="md" />
        </button>

        {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-slate-900 dark:hover:text-white ${
              currentView === 'home' || currentView === 'simulator'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-emerald-500'
                : ''
            }`}
          >
            Exame Oficial (30m)
          </button>

          <button
            onClick={() => onNavigate('themes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-slate-900 dark:hover:text-white ${
              currentView === 'themes'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-emerald-500'
                : ''
            }`}
          >
            Testes por Tema
          </button>

          <button
            onClick={() => onNavigate('hardest')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-slate-900 dark:hover:text-white ${
              currentView === 'hardest'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-emerald-500'
                : ''
            }`}
          >
            Mais Difíceis
          </button>

          <button
            onClick={() => onNavigate('stats')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-slate-900 dark:hover:text-white ${
              currentView === 'stats'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-emerald-500'
                : ''
            }`}
          >
            O Meu Desempenho
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white ${
              currentView === 'admin' || currentView === 'billing'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-emerald-500'
                : ''
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Carregar Perguntas (Airtable) & Admin</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Context Controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Quick theme toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            aria-label="Alternar tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Role quick toggle */}
          <button
            onClick={() => switchRole(currentUser?.role === 'admin' ? 'student' : 'admin')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
            title="Alternar rapidamente entre visão de Aluno e Administrador"
          >
            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
            <span>Ver como: {currentUser?.role === 'admin' ? 'Admin' : 'Aluno'}</span>
          </button>

          {/* User authentication / Stripe PRO CTA */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {!isPro && currentUser.role === 'student' && (
                <button
                  onClick={onOpenStripe}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aderir PRO (5€/mês)</span>
                </button>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {isAdmin ? 'Administrador' : currentUser.enrolledCategory || 'Categoria B'}
                    </span>
                    <span>·</span>
                    <span className={isPro ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                      {isAdmin ? 'Gestão' : isPro ? 'PRO' : 'Gratuito'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Terminar Sessão"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Iniciar Sessão
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
