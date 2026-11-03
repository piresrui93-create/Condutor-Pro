import React, { useState, useEffect, useCallback } from 'react';
import { Question, ExamAttempt } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  AlertCircle,
  RotateCcw,
  BarChart2,
  BookOpen,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamEngineProps {
  questions: Question[];
  mode: 'global' | 'theme' | 'hardest';
  categoryTitle?: string;
  onExit: () => void;
  onViewStats: () => void;
  onRetake: () => void;
  onNeedProUpgrade: () => void;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({
  questions,
  mode,
  categoryTitle,
  onExit,
  onViewStats,
  onRetake,
  onNeedProUpgrade
}) => {
  const { currentUser, completeExam, categoryConfigs } = useApp();
  const studentCat = currentUser?.enrolledCategory || 'Categoria B';
  const activeConfig = categoryConfigs[studentCat] || {
    category: 'Categoria B',
    name: 'Categoria B (Ligeiros de Passageiros)',
    shortName: 'Cat. B',
    totalQuestions: 30,
    durationMinutes: 30,
    minCorrectToPass: 27,
    description: 'Automóveis ligeiros'
  };

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(() => (activeConfig.durationMinutes || 30) * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [resultAttempt, setResultAttempt] = useState<ExamAttempt | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (isFinished) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished && !reviewMode) return;

      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === '1' || e.key.toLowerCase() === 'a') {
        if (!reviewMode && currentQ?.options[0]) selectAnswer(0);
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        if (!reviewMode && currentQ?.options[1]) selectAnswer(1);
      } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
        if (!reviewMode && currentQ?.options[2]) selectAnswer(2);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFlag();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFinished, reviewMode, currentQ]);

  const selectAnswer = (optionIndex: number) => {
    if (isFinished && !reviewMode) return;
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const toggleFlag = () => {
    setFlagged(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const goToNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  const handleFinishExam = useCallback(() => {
    setShowConfirmFinish(false);
    setIsFinished(true);

    let correct = 0;
    let incorrect = 0;
    const attemptAnswers: Record<string, number> = {};

    questions.forEach((q, idx) => {
      const selected = answers[idx];
      if (selected !== undefined) {
        attemptAnswers[q.id] = selected;
      }
      if (selected === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    // Dynamic pass condition according to the active category configuration
    const passThreshold = activeConfig.minCorrectToPass || 27;
    const passed = correct >= passThreshold;

    if (passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    const initialDuration = (activeConfig.durationMinutes || 30) * 60;
    const timeSpent = initialDuration - timeLeft;

    const savedAttempt = completeExam({
      mode,
      category: questions[0]?.category,
      totalQuestions,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unansweredCount: totalQuestions - Object.keys(answers).length,
      passed,
      timeSpentSeconds: Math.max(1, timeSpent),
      answers: attemptAnswers,
      questionIds: questions.map(q => q.id)
    });

    setResultAttempt(savedAttempt);
  }, [answers, questions, timeLeft, mode, totalQuestions, completeExam, activeConfig]);


  // Format time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // If there are no questions available for this category/mode
  if (totalQuestions === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sem Perguntas Disponíveis
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Ainda não existem perguntas carregadas para <strong className="text-slate-900 dark:text-white">{studentCat}</strong>.
            {currentUser?.role === 'admin' 
              ? ' Como administrador, aceda à secção de Administração para sincronizar a tabela do Airtable correspondente.' 
              : ' As questões estão a ser preparadas pela administração da escola. Por favor volte a tentar mais tarde.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onExit}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 shadow-sm transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // If exam finished and not in question-by-question review, render result scorecard
  if (isFinished && resultAttempt && !reviewMode) {
    const isPass = resultAttempt.passed;
    const errorsAllowed = Math.max(0, activeConfig.totalQuestions - activeConfig.minCorrectToPass);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
        
        {/* Result Header Card */}
        <div className={`p-8 rounded-3xl border text-center shadow-lg transition-all ${
          isPass 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
        }`}>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-sm bg-white dark:bg-slate-900">
            {isPass ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-12 h-12 text-rose-600 dark:text-rose-400" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            <span>{activeConfig.name}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {isPass ? 'APROVADO NO EXAME DE CÓDIGO!' : 'REPROVADO NO EXAME'}
          </h1>
          
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            {isPass 
              ? `Parabéns! Obteve a pontuação necessária para aprovar em ${activeConfig.shortName} (mínimo de ${activeConfig.minCorrectToPass} respostas certas em ${totalQuestions}).`
              : `Não atingiu a pontuação mínima de aprovação exigida (${activeConfig.minCorrectToPass} certas em ${totalQuestions}). Foram cometidos ${resultAttempt.incorrectAnswers} erros (máximo permitido: ${errorsAllowed}).`}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto text-left">
            
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block">Respostas Certas</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {resultAttempt.correctAnswers} / {totalQuestions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block">Erros Cometidos</span>
              <span className={`text-2xl font-black tabular-nums ${
                resultAttempt.incorrectAnswers <= errorsAllowed ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {resultAttempt.incorrectAnswers} <span className="text-xs font-normal text-slate-400">/ máx {errorsAllowed}</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block">Tempo Utilizado</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {formatTime(resultAttempt.timeSpentSeconds)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block">Precisão</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {Math.round((resultAttempt.correctAnswers / totalQuestions) * 100)}%
              </span>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => { setReviewMode(true); setCurrentIndex(0); }}
              className="px-5 py-3 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Rever Todas as Perguntas & Respostas</span>
            </button>

            <button
              onClick={() => {
                if (currentUser?.subscriptionStatus !== 'active_pro') {
                  onNeedProUpgrade();
                } else {
                  onRetake();
                }
              }}
              className="px-5 py-3 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Novo Teste (Perguntas Inéditas)</span>
            </button>

            <button
              onClick={onViewStats}
              className="px-5 py-3 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Ver Estatísticas por Tema</span>
            </button>
          </div>

        </div>

      </div>
    );
  }

  // Active or Review Question View
  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
      
      {/* Top Status Bar: Mode, Question Counter, Countdown Timer */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Sair do exame"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span>{categoryTitle || activeConfig.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Mín. {activeConfig.minCorrectToPass} certas
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              Questão {currentIndex + 1} de {totalQuestions}
            </div>
          </div>
        </div>

        {/* Right side: Timer & Action */}
        <div className="flex items-center gap-3">
          {!reviewMode ? (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold tabular-nums border ${
              timeLeft < 300 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <div className="text-xs font-bold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg">
              Modo de Revisão
            </div>
          )}

          {!reviewMode && (
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs"
            >
              Finalizar Teste
            </button>
          )}

          {reviewMode && (
            <button
              onClick={() => setReviewMode(false)}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Voltar ao Resumo
            </button>
          )}
        </div>
      </div>

      {/* Main Question Card with Photo and Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Question Photo with Zoom */}
        <div className="lg:col-span-6 space-y-2">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-[4/3] group shadow-sm">
            <img
              src={currentQ.imageUrl}
              alt="Cenário oficial da questão de exame"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                // styled fallback in case of network issue
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            {/* Expand / Zoom button */}
            <button
              onClick={() => setZoomedImage(currentQ.imageUrl)}
              className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg backdrop-blur-xs transition-colors"
              title="Ampliar fotografia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Category watermark tag */}
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs rounded-md text-[11px] font-medium text-white/90">
              {currentQ.category}
            </div>
          </div>

          {currentQ.imageCaption && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic px-1">
              {currentQ.imageCaption}
            </p>
          )}
        </div>

        {/* Right Column (6-7 Cols): Question Statement and Multiple Choice Options */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Question Text */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              const optionLetters = ['A', 'B', 'C', 'D'];
              const letter = optionLetters[idx];
              const isSelected = answers[currentIndex] === idx;
              const isCorrectAnswer = currentQ.correctAnswer === idx;

              let optionStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-emerald-600';

              if (reviewMode) {
                if (isCorrectAnswer) {
                  optionStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500';
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500';
                }
              } else if (isSelected) {
                optionStyle = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  disabled={reviewMode}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 shadow-xs ${optionStyle}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                    reviewMode && isCorrectAnswer
                      ? 'bg-emerald-600 text-white'
                      : reviewMode && isSelected && !isCorrectAnswer
                      ? 'bg-rose-600 text-white'
                      : isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {letter}
                  </div>

                  <span className="text-sm font-medium pt-0.5 leading-relaxed">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation during review mode */}
          {reviewMode && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Explicação Oficial: {currentQ.lawArticle || 'Código da Estrada'}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Question action buttons: Flag & Navigation */}
          <div className="flex items-center justify-between pt-2">
            {!reviewMode && (
              <button
                onClick={toggleFlag}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  flagged[currentIndex]
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged[currentIndex] ? 'Marcada para Rever' : 'Marcar para Rever'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-200 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === totalQuestions - 1}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
              >
                <span>Seguinte</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Matrix of Questions (1 to 30) */}
      <div className="mt-8 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Grelha de Questões ({answeredCount}/{totalQuestions} respondidas)
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Respondida</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Dúvida</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span>Por responder</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 sm:gap-2">
          {questions.map((q, idx) => {
            const isAnswered = answers[idx] !== undefined;
            const isFlagged = flagged[idx];
            const isCurrent = currentIndex === idx;

            let buttonStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';

            if (reviewMode) {
              const wasCorrect = answers[idx] === q.correctAnswer;
              buttonStyle = wasCorrect 
                ? 'bg-emerald-500 text-white font-bold' 
                : 'bg-rose-500 text-white font-bold';
            } else if (isFlagged) {
              buttonStyle = 'bg-amber-500 text-white font-bold';
            } else if (isAnswered) {
              buttonStyle = 'bg-emerald-600 text-white font-bold';
            }

            return (
              <button
                key={`${q.id}_${idx}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-8 sm:h-9 rounded-lg text-xs font-semibold tabular-nums transition-all flex items-center justify-center relative ${buttonStyle} ${
                  isCurrent ? 'ring-2 ring-slate-900 dark:ring-white scale-105 z-10' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>


      {/* Confirmation Modal to Finish Exam */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Deseja terminar o exame agora?
                </h3>
                <p className="text-xs text-slate-500">
                  Ainda dispõe de {formatTime(timeLeft)} de tempo oficial.
                </p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                <strong>Atenção:</strong> Deixou {unansweredCount} questão(ões) por responder. Questões em branco contam como resposta errada!
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Continuar a Responder
              </button>
              <button
                onClick={handleFinishExam}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
              >
                Sim, Submeter Exame
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Fullscreen Image Zoom Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={zoomedImage} 
              alt="Fotografia da questão ampliada" 
              className="rounded-2xl max-h-[85vh] w-auto mx-auto object-contain shadow-2xl border border-slate-700"
            />
            <p className="text-center text-xs text-slate-300 mt-2">
              Clique em qualquer ponto para fechar a visualização detalhada.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
