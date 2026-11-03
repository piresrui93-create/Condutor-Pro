import React from 'react';
import { useApp } from '../context/AppContext';
import { QuestionCategory, DriverCategory, ALL_DRIVER_CATEGORIES } from '../types';
import { 
  Car, 
  Layers, 
  Flame, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  BookOpen,
  Award,
  BarChart3,
  Database,
  GraduationCap
} from 'lucide-react';

interface ExamModePickerProps {
  onStartExam: (mode: 'global' | 'theme' | 'hardest', category?: QuestionCategory) => void;
  onOpenStripe: () => void;
  onViewStats: () => void;
  onGoToAdmin: () => void;
}

export const ExamModePicker: React.FC<ExamModePickerProps> = ({
  onStartExam,
  onOpenStripe,
  onViewStats,
  onGoToAdmin
}) => {
  const { currentUser, attempts, questions, categoryConfigs, updateUserCategory } = useApp();

  const isPro = currentUser?.subscriptionStatus === 'active_pro';
  const hasFreeTestAvailable = !currentUser?.freeTestCompleted && !isPro;

  const currentCategory: DriverCategory = currentUser?.enrolledCategory || 'Categoria B';
  const activeConfig = categoryConfigs[currentCategory] || {
    totalQuestions: 30,
    durationMinutes: 30,
    minCorrectToPass: 27,
    description: 'Critério oficial do IMT'
  };
  const maxErrorsAllowed = activeConfig.totalQuestions - activeConfig.minCorrectToPass;

  const categories: { title: QuestionCategory; desc: string; icon: string }[] = [
    {
      title: 'Sinais de Trânsito',
      desc: 'Regulamentação, perigo, indicação e marcas rodoviárias no pavimento.',
      icon: '🛑'
    },
    {
      title: 'Regras de Prioridade e Cruzamentos',
      desc: 'Prioridade da direita, rotundas, entroncamentos e veículos de socorro.',
      icon: '🚗'
    },
    {
      title: 'Velocidades e Distâncias',
      desc: 'Limites por via e veículo, distância de reação, travagem e paragem.',
      icon: '⚡'
    },
    {
      title: 'Manobras e Vias Especiais',
      desc: 'Ultrapassagem, inversão de marcha, autoestradas e paragem/estacionamento.',
      icon: '🛣️'
    },
    {
      title: 'Segurança Rodoviária, Luzes e Álcool',
      desc: 'Taxa de álcool, uso de telemóvel, iluminação noturna e cintos de segurança.',
      icon: '⚠️'
    },
    {
      title: 'Mecânica Básica e Equipamentos',
      desc: 'Pneus e profundidade dos sulcos, sistema ABS, triângulo e colete retrorrefletor.',
      icon: '🔧'
    }
  ];

  const handleModeClick = (mode: 'global' | 'theme' | 'hardest', category?: QuestionCategory) => {
    // If student is on free trial and has already used their 1 free test:
    if (currentUser?.role === 'student' && !isPro && currentUser.freeTestCompleted) {
      onOpenStripe();
      return;
    }

    onStartExam(mode, category);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-200">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[420px]">
          
          {/* Left Text Zone */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6 z-10">
            <div className="space-y-4">
              
              {/* Dynamic criteria banner & Category Badge */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-400">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 font-bold">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentCategory}</span>
                </div>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{activeConfig.totalQuestions} Perguntas</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{activeConfig.durationMinutes} Minutos</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Aprovação a {activeConfig.minCorrectToPass}+ (máx. {maxErrorsAllowed} {maxErrorsAllowed === 1 ? 'erro' : 'erros'})</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">Alterar Categoria / Curso:</span>
                <select
                  value={currentCategory}
                  onChange={(e) => updateUserCategory(e.target.value as DriverCategory)}
                  className="text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {ALL_DRIVER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Simulador Oficial de Exames de Código
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Treina com perguntas reais e fotografias rodoviárias autênticas adaptadas ao teu curso de <strong className="text-white">{currentCategory}</strong>. O nosso motor inteligente prioriza sempre as questões que ainda não respondeste.
              </p>
            </div>

            {/* Trial / PRO Status Box */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => handleModeClick('global')}
                  className="px-6 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 group"
                >
                  <Car className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>
                    {hasFreeTestAvailable 
                      ? 'Começar Teste Oficial Gratuito' 
                      : isPro 
                      ? `Iniciar Nova Simulação (${activeConfig.totalQuestions}Q)` 
                      : 'Desbloquear Acesso Ilimitado (5€/mês)'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onViewStats}
                  className="px-5 py-3.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Ver O Meu Desempenho</span>
                </button>

                <button
                  onClick={onGoToAdmin}
                  className="px-4 py-3.5 text-sm font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/80 rounded-xl transition-colors flex items-center gap-2"
                  title="Aceder ao portal de administração para carregar perguntas do Airtable"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Carregar Perguntas (Airtable)</span>
                </button>
              </div>

              {/* Status explanation */}
              <div className="text-xs text-slate-400 flex items-center gap-2">
                {isPro ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Plano CondutorPRO Ativo — Acesso Ilimitado a todas as perguntas e temas
                  </span>
                ) : (
                  <span>
                    {hasFreeTestAvailable ? (
                      <>
                        <strong className="text-white">1 Teste Gratuito disponível.</strong> Após o primeiro teste, subscrição total por apenas 5€/mês.
                      </>
                    ) : (
                      <span className="text-amber-400">
                        O teu teste gratuito já foi concluído. Subscreve por 5€/mês para continuar a treinar.
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Right Hero Image (High Res Cockpit Photography) */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src="/src/assets/images/hero_driving_simulator_1793442879807.jpg"
              alt="Cockpit do condutor em autoestrada com pórtico de sinalização"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-transparent to-transparent opacity-90 lg:opacity-75" />
          </div>

        </div>
      </div>

      {/* Feature & Modes Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Modalidades de Treino
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Escolha o método ideal para acelerar a sua aprendizagem para a carta de condução.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Exame Oficial Global */}
          <div 
            onClick={() => handleModeClick('global')}
            className="group relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Car className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  Simulação Oficial · {currentCategory}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  Exame Global ({activeConfig.totalQuestions} Perguntas)
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Reprodução fiel do exame oficial para {currentCategory}. {activeConfig.totalQuestions} perguntas com fotografias reais e {activeConfig.durationMinutes} minutos. Máximo de {maxErrorsAllowed} {maxErrorsAllowed === 1 ? 'erro permitido' : 'erros permitidos'} (aprovação com {activeConfig.minCorrectToPass} certas).
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Fazer Exame Completo</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: Perguntas Mais Difíceis */}
          <div 
            onClick={() => handleModeClick('hardest')}
            className="group relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
                <Flame className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                    Alto Índice de Reprovação
                  </span>
                  {!isPro && !hasFreeTestAvailable && (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  Perguntas Mais Difíceis
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                As questões com as maiores taxas de erro em exames reais. Teste as verdadeiras "armadilhas do código" sobre prioridades cruzadas, alcoolemia e rotundas de 3 vias.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
              <span>Treinar Armadilhas</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 3: Testes por Tema */}
          <div 
            onClick={() => {
              const el = document.getElementById('theme-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                <Layers className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Estudo Focado
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  Testes por Categoria
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pratique categorias específicas onde tenha mais dúvidas: Sinais, Regras de Prioridade, Velocidades, Manobras, Segurança Noturna e Mecânica Elementar.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Ver 6 Temas Oficiais</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>
      </div>

      {/* Theme Selection Grid Section */}
      <div id="theme-section" className="space-y-6 pt-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Testes por Tema Oficial do Código da Estrada
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Perguntas com seleção inteligente que dá prioridade a questões ainda não vistas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const countForCat = questions.filter(q => q.category === cat.title).length;

            return (
              <div
                key={cat.title}
                onClick={() => handleModeClick('theme', cat.title)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {countForCat} perguntas
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {cat.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Praticar este tema</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Aprovado por milhares de novos condutores em Portugal
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          O CondutorPRO segue rigorosamente a matriz oficial de exame de código do IMT. Atualizado com as mais recentes alterações ao Código da Estrada, circulação em rotundas e limites agravados.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Fotografias reais em todas as perguntas
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            30 perguntas / 30 minutos
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Pagamento seguro Stripe 5€/mês
          </span>
        </div>
      </div>

    </div>
  );
};
