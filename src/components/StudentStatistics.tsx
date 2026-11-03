import React from 'react';
import { useApp } from '../context/AppContext';
import { QuestionCategory } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  AlertCircle, 
  Target, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface StudentStatisticsProps {
  onStartThemeTest: (category: QuestionCategory) => void;
  onStartOfficialTest: () => void;
}

export const StudentStatistics: React.FC<StudentStatisticsProps> = ({
  onStartThemeTest,
  onStartOfficialTest
}) => {
  const { currentUser, attempts, getCategoryPerformance, getOverallReadiness } = useApp();

  const userAttempts = attempts.filter(a => a.userId === currentUser?.id);
  const categoryStats = getCategoryPerformance(currentUser?.id);
  const readiness = getOverallReadiness(currentUser?.id);

  const totalExams = userAttempts.length;
  const passedExams = userAttempts.filter(a => a.passed).length;
  const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;
  
  const avgCorrect = totalExams > 0
    ? (userAttempts.reduce((acc, curr) => acc + curr.correctAnswers, 0) / totalExams).toFixed(1)
    : '0';

  // Find weakest theme
  const themesWithAttempts = categoryStats.filter(c => c.totalAnswered > 0);
  const sortedThemes = [...themesWithAttempts].sort((a, b) => a.percentage - b.percentage);
  const weakestTheme = sortedThemes.length > 0 && sortedThemes[0].percentage < 80 ? sortedThemes[0] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner with Readiness Score */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Trophy className="w-4 h-4" />
              <span>Diagnóstico de Desempenho do Aluno</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {currentUser?.name}!
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Aqui está a evolução detalhada dos teus testes de código. Analisamos cada resposta por categoria para garantir a tua aprovação no IMT com o mínimo de 27 certas.
            </p>
          </div>

          {/* Readiness Gauge Box */}
          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shrink-0 text-center sm:min-w-[220px]">
            <span className="text-xs text-slate-300 uppercase tracking-wider block mb-1">
              Índice de Prontidão IMT
            </span>
            <div className="text-4xl sm:text-5xl font-black text-emerald-400 tabular-nums">
              {readiness}%
            </div>
            <div className="text-xs font-medium text-slate-200 mt-1">
              {readiness >= 90
                ? 'Pronto para aprovar à 1.ª!'
                : readiness >= 70
                ? 'Bom caminho, consolida os temas fracos.'
                : 'Necessita de mais simulações.'}
            </div>
          </div>
        </div>

        {/* Subtle decorative background pattern */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Exames Realizados</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalExams}
          </div>
          <span className="text-[11px] text-slate-500">Total acumulado</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Taxa de Aprovação</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {passRate}%
          </div>
          <span className="text-[11px] text-slate-500">{passedExams} exames aprovados</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Média de Certas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {avgCorrect} <span className="text-xs font-normal text-slate-400">/ 30</span>
          </div>
          <span className="text-[11px] text-slate-500">Mínimo necessário: 27</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Perguntas Vistas</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {currentUser?.seenQuestionIds.length || 0}
          </div>
          <span className="text-[11px] text-slate-500">Priorizamos sempre inéditas</span>
        </div>

      </div>

      {/* Weakest Theme Alert / Recommendation */}
      {weakestTheme && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Ponto a Melhorar: {weakestTheme.category} ({weakestTheme.percentage}% de acerto)
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Os seus erros mais frequentes acontecem neste tema. Recomendamos fazer um teste temático focado com perguntas inéditas.
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartThemeTest(weakestTheme.category)}
            className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Treinar {weakestTheme.category}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Performance by Category Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Desempenho Individual por Tema
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhe a sua taxa de acerto em cada um dos domínios do Código da Estrada português.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryStats.map((stat) => {
            const hasData = stat.totalAnswered > 0;
            const isGood = stat.percentage >= 85;
            const isMedium = stat.percentage >= 70 && stat.percentage < 85;

            return (
              <div
                key={stat.category}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {stat.category}
                  </span>
                  <span className={`text-sm font-extrabold tabular-nums ${
                    !hasData ? 'text-slate-400' : isGood ? 'text-emerald-600 dark:text-emerald-400' : isMedium ? 'text-amber-500' : 'text-rose-600'
                  }`}>
                    {hasData ? `${stat.percentage}%` : 'Sem dados'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      !hasData 
                        ? 'w-0' 
                        : isGood 
                        ? 'bg-emerald-500' 
                        : isMedium 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {hasData 
                      ? `${stat.correct} certas de ${stat.totalAnswered} respondidas`
                      : 'Nenhuma pergunta respondida ainda'}
                  </span>
                  <button
                    onClick={() => onStartThemeTest(stat.category)}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Treinar Tema
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History of Exam Attempts */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Histórico de Testes Realizados
            </h2>
            <p className="text-xs text-slate-500">
              Todos os exames realizados nesta conta.
            </p>
          </div>

          {userAttempts.length > 0 && (
            <button
              onClick={onStartOfficialTest}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Fazer Novo Teste
            </button>
          )}
        </div>

        {userAttempts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ainda não realizou nenhum teste
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Inicie a sua primeira simulação oficial de 30 perguntas para desbloquear as estatísticas e diagnóstico por tema.
            </p>
            <button
              onClick={onStartOfficialTest}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              Iniciar Teste Gratuito
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Tipo de Teste</th>
                  <th className="py-3 px-3">Pontuação</th>
                  <th className="py-3 px-3">Erros</th>
                  <th className="py-3 px-3">Tempo</th>
                  <th className="py-3 px-3 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userAttempts.map((attempt, attemptIdx) => {
                  const dateStr = new Date(attempt.date).toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const mins = Math.floor(attempt.timeSpentSeconds / 60);
                  const secs = attempt.timeSpentSeconds % 60;
                  const timeStr = `${mins}m ${secs}s`;

                  return (
                    <tr key={`${attempt.id}-${attemptIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {attempt.mode === 'global' ? 'Exame Oficial IMT' : attempt.mode === 'hardest' ? 'Mais Difíceis' : attempt.category || 'Teste por Tema'}
                      </td>
                      <td className="py-3 px-3 font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {attempt.correctAnswers} / {attempt.totalQuestions}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-500">
                        {attempt.incorrectAnswers} erros
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {timeStr}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${
                          attempt.passed 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {attempt.passed ? 'APROVADO' : 'REPROVADO'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
