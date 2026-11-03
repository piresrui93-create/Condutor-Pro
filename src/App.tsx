import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ExamModePicker } from './components/ExamModePicker';
import { ExamEngine } from './components/ExamEngine';
import { StudentStatistics } from './components/StudentStatistics';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { selectQuestions } from './utils/questionSelector';
import { Question, QuestionCategory } from './types';

function MainApp() {
  const { currentUser, questions, categoryConfigs } = useApp();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'simulator' | 'themes' | 'hardest' | 'stats' | 'admin' | 'billing'>('home');
  
  // Active Exam state
  const [activeExamQuestions, setActiveExamQuestions] = useState<Question[]>([]);
  const [activeExamMode, setActiveExamMode] = useState<'global' | 'theme' | 'hardest'>('global');
  const [activeExamCategoryTitle, setActiveExamCategoryTitle] = useState<string | undefined>(undefined);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'student' | 'admin'>('student');
  const [isStripeOpen, setIsStripeOpen] = useState(false);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('condutorpro_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('condutorpro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('condutorpro_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Launch a new exam with smart question selection
  const handleStartExam = (mode: 'global' | 'theme' | 'hardest', category?: QuestionCategory) => {
    // Check if user is not logged in
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    // Check paywall: student with free test already completed and not PRO
    if (currentUser.role === 'student' && currentUser.subscriptionStatus !== 'active_pro' && currentUser.freeTestCompleted) {
      setIsStripeOpen(true);
      return;
    }

    const studentCat = currentUser.enrolledCategory || 'Categoria B';
    const activeCfg = categoryConfigs[studentCat] || { totalQuestions: 30 };
    const examQuestionCount = mode === 'global' ? activeCfg.totalQuestions : Math.min(activeCfg.totalQuestions, questions.length);

    // Smart question selection: prioritizes questions not yet seen by this student and matches their enrolled category!
    const selected = selectQuestions(questions, {
      mode,
      category,
      driverCategory: studentCat,
      seenQuestionIds: currentUser.seenQuestionIds || [],
      count: examQuestionCount
    });

    setActiveExamQuestions(selected);
    setActiveExamMode(mode);
    setActiveExamCategoryTitle(category);
    setCurrentView('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeExam = () => {
    handleStartExam(activeExamMode, activeExamCategoryTitle as QuestionCategory | undefined);
  };

  const handleNavigate = (view: 'home' | 'simulator' | 'themes' | 'hardest' | 'stats' | 'admin' | 'billing') => {
    if (view === 'admin' || view === 'billing') {
      if (currentUser?.role !== 'admin') {
        setAuthDefaultTab('admin');
        setIsAuthOpen(true);
        return;
      }
    }

    if (view === 'hardest') {
      handleStartExam('hardest');
      return;
    }

    if (view === 'themes') {
      // scroll to themes or show home
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById('theme-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => { setAuthDefaultTab('student'); setIsAuthOpen(true); }}
        onOpenStripe={() => setIsStripeOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-12">
        {currentView === 'home' && (
          <ExamModePicker
            onStartExam={handleStartExam}
            onOpenStripe={() => setIsStripeOpen(true)}
            onViewStats={() => setCurrentView('stats')}
            onGoToAdmin={() => handleNavigate('admin')}
          />
        )}

        {currentView === 'simulator' && activeExamQuestions.length > 0 && (
          <ExamEngine
            questions={activeExamQuestions}
            mode={activeExamMode}
            categoryTitle={activeExamCategoryTitle}
            onExit={() => setCurrentView('home')}
            onViewStats={() => setCurrentView('stats')}
            onRetake={handleRetakeExam}
            onNeedProUpgrade={() => setIsStripeOpen(true)}
          />
        )}

        {currentView === 'stats' && (
          <StudentStatistics
            onStartThemeTest={(cat) => handleStartExam('theme', cat)}
            onStartOfficialTest={() => handleStartExam('global')}
          />
        )}

        {(currentView === 'admin' || currentView === 'billing') && (
          <AdminDashboard />
        )}
      </main>

      {/* Mobile Bottom Dock for PWA Feel */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenStripe={() => setIsStripeOpen(true)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">CondutorPRO</span>
            <span>· Simulador Oficial de Código IMT</span>
            <span>· Portugal</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>30 Perguntas · 30 Minutos · Mínimo 27 Certas</span>
            <span>·</span>
            <span>Pagamentos Seguros com Stripe (5€/mês)</span>
          </div>

          <div className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} CondutorPRO. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={authDefaultTab}
      />

      <StripeCheckoutModal
        isOpen={isStripeOpen}
        onClose={() => setIsStripeOpen(false)}
        onSuccess={() => {
          // Handled inside modal with confetti & alert
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
