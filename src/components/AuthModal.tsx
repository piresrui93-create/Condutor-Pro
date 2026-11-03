import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DriverCategory, ALL_DRIVER_CATEGORIES } from '../types';
import { X, Mail, Lock, User, ShieldCheck, Check, Sparkles, Award } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'student' | 'admin';
}

const CATEGORY_DETAILS: Record<DriverCategory, { icon: string; subtitle: string; condition: string }> = {
  'Categoria B': {
    icon: '🚗',
    subtitle: 'Ligeiros de passageiros e mercadorias',
    condition: '30 Perguntas · 30 min · Mín. 27 certas'
  },
  'Categoria A1': {
    icon: '🛵',
    subtitle: 'Motociclos até 125cm³ e quadriciclos',
    condition: '30 Perguntas · 30 min · Mín. 27 certas'
  },
  'Categoria A': {
    icon: '🏍️',
    subtitle: 'Motociclos sem limite de cilindrada',
    condition: '30 Perguntas · 30 min · Mín. 27 certas'
  },
  'Curso Instrutores de Condução Automóvel': {
    icon: '🎓',
    subtitle: 'Formação pedagógica e técnica oficial IMT',
    condition: '50 Perguntas · 60 min · Mín. 45 certas'
  },
  'Curso de Diretor de Escola de Condução': {
    icon: '📋',
    subtitle: 'Coordenação e gestão pedagógica de escola',
    condition: '50 Perguntas · 60 min · Mín. 45 certas'
  },
  'Curso TVDE': {
    icon: '🚕',
    subtitle: 'Transporte em veículos descaracterizados',
    condition: '30 Perguntas · 30 min · Mín. 27 certas'
  }
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'student'
}) => {
  const { login, loginWithGoogle, register, categoryConfigs } = useApp();

  const [tab, setTab] = useState<'student' | 'admin'>(defaultTab);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nif, setNif] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DriverCategory>('Categoria B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await register(name || email.split('@')[0], email, selectedCategory, nif);
      } else {
        await login(email, 'student');
      }
      setLoading(false);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Falha na autenticação.');
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email || 'admin@condutorpro.pt', 'admin');
      setLoading(false);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError('Credenciais de administrador inválidas.');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    await loginWithGoogle(selectedCategory);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Autenticação CondutorPRO</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection: Aluno vs Administrador */}
        <div className="px-6 pt-3 pb-1 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => { setTab('student'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'student'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Área do Aluno
            </button>
            <button
              onClick={() => { setTab('admin'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Administrador</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable Form Area */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {tab === 'student' ? (
            <div className="space-y-4">
              {/* Free Trial Perk Badge */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>1 Teste Gratuito incluído!</strong> Simule o exame oficial da categoria que escolher.
                </span>
              </div>

              {/* Google One-Click Login */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com o Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 shrink-0">
                  ou com e-mail
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleStudentSubmit} className="space-y-3.5">
                {isRegistering && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex. Maria Santos"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aluno@exemplo.pt"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Palavra-passe
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* SINGLE-SELECT CATEGORY / COURSE PICKER AT REGISTRATION */}
                {isRegistering && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Qual a categoria que pretende? <span className="text-emerald-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Apenas 1 opção)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {ALL_DRIVER_CATEGORIES.map((catKey) => {
                        const details = CATEGORY_DETAILS[catKey];
                        const cfg = categoryConfigs[catKey];
                        const isSelected = selectedCategory === catKey;

                        return (
                          <div
                            key={catKey}
                            onClick={() => setSelectedCategory(catKey)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="text-xl shrink-0 mt-0.5">
                              {details?.icon || '🚗'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {catKey}
                                </span>
                                {isSelected ? (
                                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>
                                ) : (
                                  <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {details?.subtitle}
                              </p>
                              <div className="mt-1 inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                                {cfg ? `${cfg.totalQuestions} perguntas · ${cfg.durationMinutes} min · Mín. ${cfg.minCorrectToPass} certas` : details?.condition}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isRegistering && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      NIF (para recibos da subscrição)
                    </label>
                    <input
                      type="text"
                      value={nif}
                      onChange={(e) => setNif(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="ex. 254890123 (opcional)"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
                >
                  {loading ? 'A processar...' : isRegistering ? `Criar Conta (${selectedCategory})` : 'Entrar na Plataforma'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {isRegistering ? 'Já tem conta? Entrar aqui' : 'Não tem conta? Registar gratuitamente'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Admin Content */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  Portal de Gestão, Faturação & Exames
                </div>
                <div>
                  Acesso para gerir receitas Stripe, faturas com NIF, importar perguntas do Airtable para cada categoria e configurar as condições de aprovação.
                </div>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Administrador
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@condutorpro.pt"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Palavra-passe
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
                >
                  {loading ? 'A verificar...' : 'Entrar como Administrador'}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
