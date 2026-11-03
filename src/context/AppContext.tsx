import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Question, 
  ExamAttempt, 
  BillingInvoice, 
  QuestionCategory, 
  CategoryPerformance,
  SubscriptionStatus,
  DriverCategory,
  CategoryExamConfig,
  CategoryAirtableConfig,
  ALL_DRIVER_CATEGORIES
} from '../types';
import { fetchQuestionsFromAirtableApi } from '../utils/excelParser';

export const DEFAULT_CATEGORY_CONFIGS: Record<DriverCategory, CategoryExamConfig> = {
  'Categoria B': {
    category: 'Categoria B',
    name: 'Categoria B (Ligeiros de Passageiros)',
    shortName: 'Cat. B',
    totalQuestions: 30,
    durationMinutes: 30,
    minCorrectToPass: 27,
    description: 'Automóveis ligeiros de passageiros e mercadorias até 3.500 kg.',
    badgeColor: 'emerald'
  },
  'Categoria A1': {
    category: 'Categoria A1',
    name: 'Categoria A1 (Motociclos até 125cc)',
    shortName: 'Cat. A1',
    totalQuestions: 30,
    durationMinutes: 30,
    minCorrectToPass: 27,
    description: 'Motociclos de cilindrada não superior a 125 cm³ e potência até 11 kW.',
    badgeColor: 'blue'
  },
  'Categoria A': {
    category: 'Categoria A',
    name: 'Categoria A (Motociclos sem Limite)',
    shortName: 'Cat. A',
    totalQuestions: 30,
    durationMinutes: 30,
    minCorrectToPass: 27,
    description: 'Motociclos com ou sem carro lateral, sem limite de cilindrada.',
    badgeColor: 'indigo'
  },
  'Curso Instrutores de Condução Automóvel': {
    category: 'Curso Instrutores de Condução Automóvel',
    name: 'Curso de Instrutores de Condução Automóvel',
    shortName: 'Instrutores',
    totalQuestions: 50,
    durationMinutes: 60,
    minCorrectToPass: 45,
    description: 'Avaliação teórica e pedagógica oficial do IMT para acesso à profissão de instrutor.',
    badgeColor: 'purple'
  },
  'Curso de Diretor de Escola de Condução': {
    category: 'Curso de Diretor de Escola de Condução',
    name: 'Curso de Diretor de Escola de Condução',
    shortName: 'Diretor Esc. Condução',
    totalQuestions: 50,
    durationMinutes: 60,
    minCorrectToPass: 45,
    description: 'Regulamentação jurídica, gestão e coordenação pedagógica de escolas de condução.',
    badgeColor: 'amber'
  },
  'Curso TVDE': {
    category: 'Curso TVDE',
    name: 'Curso de Certificação TVDE (Descaracterizados)',
    shortName: 'Curso TVDE',
    totalQuestions: 30,
    durationMinutes: 30,
    minCorrectToPass: 27,
    description: 'Transporte individual e remunerado de passageiros em veículos descaracterizados.',
    badgeColor: 'teal'
  }
};

export const DEFAULT_CATEGORY_AIRTABLE_CONFIGS: Record<DriverCategory, CategoryAirtableConfig> = {
  'Categoria B': {
    category: 'Categoria B',
    baseId: 'appUE8v1QiipoQRKy',
    tableIdOrName: 'tblI3NbgzjCKlruXc',
    autoSync: true
  },
  'Categoria A1': {
    category: 'Categoria A1',
    baseId: 'appUE8v1QiipoQRKy',
    tableIdOrName: 'tblI3NbgzjCKlruXc',
    autoSync: true
  },
  'Categoria A': {
    category: 'Categoria A',
    baseId: 'appUE8v1QiipoQRKy',
    tableIdOrName: 'tblI3NbgzjCKlruXc',
    autoSync: true
  },
  'Curso Instrutores de Condução Automóvel': {
    category: 'Curso Instrutores de Condução Automóvel',
    baseId: 'appUE8v1QiipoQRKy',
    tableIdOrName: 'tblI3NbgzjCKlruXc',
    autoSync: true
  },
  'Curso de Diretor de Escola de Condução': {
    category: 'Curso de Diretor de Escola de Condução',
    baseId: 'appUE8v1QiipoQRKy',
    tableIdOrName: 'tblI3NbgzjCKlruXc',
    autoSync: true
  },
  'Curso TVDE': {
    category: 'Curso TVDE',
    baseId: 'appUE8v1QiipoQRKy',
    tableIdOrName: 'tblI3NbgzjCKlruXc',
    autoSync: true
  }
};

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  questions: Question[];
  attempts: ExamAttempt[];
  invoices: BillingInvoice[];
  categoryConfigs: Record<DriverCategory, CategoryExamConfig>;
  categoryAirtableConfigs: Record<DriverCategory, CategoryAirtableConfig>;
  airtableToken: string;
  isSyncingAirtable: boolean;
  lastAutoSyncTime: string | null;
  autoSyncStatus: { success: boolean; message: string; timestamp: string } | null;
  setAirtableToken: (token: string) => void;
  updateCategoryConfig: (config: CategoryExamConfig) => void;
  resetCategoryConfigs: () => void;
  updateCategoryAirtableConfig: (category: DriverCategory, patch: Partial<CategoryAirtableConfig>) => void;
  syncCategoryFromAirtable: (category: DriverCategory, tokenOverride?: string) => Promise<{ success: boolean; count: number; message: string }>;
  syncAllCategoriesFromAirtable: (tokenOverride?: string) => Promise<{ success: boolean; results: Record<string, number>; totalAdded: number; message: string }>;
  updateUserCategory: (category: DriverCategory, userId?: string) => void;
  login: (email: string, role?: 'student' | 'admin') => Promise<boolean>;
  loginWithGoogle: (preferredCategory?: DriverCategory) => Promise<boolean>;
  register: (name: string, email: string, category: DriverCategory, nif?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: 'student' | 'admin') => void;
  completeExam: (attempt: Omit<ExamAttempt, 'id' | 'userId' | 'date'>) => ExamAttempt;
  subscribePro: (details: { paymentMethod: 'Stripe Card' | 'MB WAY' | 'Multibanco' | 'Apple Pay'; nif?: string; cardLast4?: string }) => Promise<BillingInvoice>;
  importQuestions: (newQuestions: Question[]) => number;
  addQuestion: (question: Omit<Question, 'id'>) => Question;
  updateQuestion: (question: Question) => void;
  deleteQuestion: (id: string) => void;
  clearAllQuestions: () => void;
  resetToZero: () => void;
  getUserAttempts: (userId?: string) => ExamAttempt[];
  getCategoryPerformance: (userId?: string) => CategoryPerformance[];
  getOverallReadiness: (userId?: string) => number;
  refundInvoice: (invoiceId: string) => void;
  updateUserSubscription: (userId: string, status: SubscriptionStatus) => void;
}

const STORAGE_KEY_PREFIX = 'condutorpro_';

// Pristine clean setup: only 1 initial admin user Rui Pires. ZERO mock students.
const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Rui Pires (Administrador)',
    email: 'admin@condutorpro.pt',
    role: 'admin',
    subscriptionStatus: 'active_pro',
    freeTestCompleted: true,
    enrolledCategory: 'Categoria B',
    createdAt: '2026-09-01T08:00:00Z',
    seenQuestionIds: []
  }
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Airtable PAT token
  const [airtableToken, setAirtableTokenState] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}airtable_token`) || '';
  });

  const setAirtableToken = (token: string) => {
    const clean = token.replace(/^Bearer\s+/i, '').replace(/[\r\n\t"']/g, '').trim();
    setAirtableTokenState(clean);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}airtable_token`, clean);
  };

  // Category Exam Configurations
  const [categoryConfigs, setCategoryConfigs] = useState<Record<DriverCategory, CategoryExamConfig>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}categoryConfigs`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CATEGORY_CONFIGS, ...parsed };
      } catch {
        return DEFAULT_CATEGORY_CONFIGS;
      }
    }
    return DEFAULT_CATEGORY_CONFIGS;
  });

  // Airtable Category Configurations
  const [categoryAirtableConfigs, setCategoryAirtableConfigs] = useState<Record<DriverCategory, CategoryAirtableConfig>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}categoryAirtableConfigs`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CATEGORY_AIRTABLE_CONFIGS, ...parsed };
      } catch {
        return DEFAULT_CATEGORY_AIRTABLE_CONFIGS;
      }
    }
    return DEFAULT_CATEGORY_AIRTABLE_CONFIGS;
  });

  // Registered Users: purge any mock sample students from legacy localStorage
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Exclude sample students like 'user-student-1', 'user-student-2', etc.
        const clean = parsed.filter(u => !u.id.startsWith('user-student-'));
        return clean.length > 0 ? clean : DEFAULT_USERS;
      } catch {
        return DEFAULT_USERS;
      }
    }
    return DEFAULT_USERS;
  });

  // Active User: Defaults to admin
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}currentUser`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id && parsed.id.startsWith('user-student-')) {
          return DEFAULT_USERS[0];
        }
        return parsed;
      } catch {
        return DEFAULT_USERS[0];
      }
    }
    return DEFAULT_USERS[0];
  });

  // Questions Bank: Starts completely empty at 0. Purges legacy sample questions.
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}questions`);
    if (saved) {
      try {
        const parsed: Question[] = JSON.parse(saved);
        // Clean out any legacy mock questions starting with 'imt-' or 'demo-sample-'
        const clean = parsed.filter(
          q => !q.id.startsWith('imt-') && !q.id.startsWith('demo-sample-')
        );
        return clean;
      } catch {
        return [];
      }
    }
    return [];
  });

  // Exam Attempts: Starts completely empty at 0.
  const [attempts, setAttempts] = useState<ExamAttempt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}attempts`);
    return saved ? JSON.parse(saved) : [];
  });

  // Billing Invoices: Starts completely empty at 0. Purges legacy sample invoices.
  const [invoices, setInvoices] = useState<BillingInvoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}invoices`);
    if (saved) {
      try {
        const parsed: BillingInvoice[] = JSON.parse(saved);
        // Filter out legacy dummy invoices starting with 'inv-100'
        return parsed.filter(inv => !inv.id.startsWith('inv-100'));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Background Sync state
  const [isSyncingAirtable, setIsSyncingAirtable] = useState(false);
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<string | null>(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}categoryConfigs`, JSON.stringify(categoryConfigs));
  }, [categoryConfigs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}categoryAirtableConfigs`, JSON.stringify(categoryAirtableConfigs));
  }, [categoryAirtableConfigs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}currentUser`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}questions`, JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}attempts`, JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);

  const updateCategoryConfig = (config: CategoryExamConfig) => {
    setCategoryConfigs(prev => ({
      ...prev,
      [config.category]: config
    }));
  };

  const resetCategoryConfigs = () => {
    setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);
  };

  const updateCategoryAirtableConfig = (category: DriverCategory, patch: Partial<CategoryAirtableConfig>) => {
    setCategoryAirtableConfigs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...patch,
        category
      }
    }));
  };

  const updateUserCategory = (category: DriverCategory, userId?: string) => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;
    setUsers(prev => prev.map(u => u.id === targetId ? { ...u, enrolledCategory: category } : u));
    if (currentUser && currentUser.id === targetId) {
      setCurrentUser(prev => prev ? { ...prev, enrolledCategory: category } : null);
    }
  };

  const clearAllQuestions = () => {
    setQuestions([]);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}questions`);
  };

  const resetToZero = () => {
    setQuestions([]);
    setAttempts([]);
    setInvoices([]);
    setUsers(DEFAULT_USERS);
    setCurrentUser(DEFAULT_USERS[0]);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}questions`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}attempts`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}invoices`);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}currentUser`, JSON.stringify(DEFAULT_USERS[0]));
  };

  /**
   * Syncs questions for a single category from Airtable
   */
  const syncCategoryFromAirtable = async (
    category: DriverCategory,
    tokenOverride?: string
  ): Promise<{ success: boolean; count: number; message: string }> => {
    const token = (tokenOverride || airtableToken || '').trim();
    const cfg = categoryAirtableConfigs[category];

    if (!token) {
      return { 
        success: false, 
        count: 0, 
        message: 'Token de Acesso Pessoal (PAT) do Airtable em falta. Crie um token em airtable.com/create/tokens.' 
      };
    }

    if (!cfg?.baseId || !cfg?.tableIdOrName) {
      return { 
        success: false, 
        count: 0, 
        message: `Configure o Base ID e a Tabela para a categoria ${category} antes de sincronizar.` 
      };
    }

    setIsSyncingAirtable(true);
    try {
      const result = await fetchQuestionsFromAirtableApi(token, cfg.baseId, cfg.tableIdOrName, category);

      if (result.questions.length === 0 && result.errors.length > 0) {
        return {
          success: false,
          count: 0,
          message: result.errors[0] || 'A tabela do Airtable não devolveu perguntas válidas.'
        };
      }

      const taggedQuestions = result.questions.map(q => ({
        ...q,
        targetCategory: category
      }));

      // Update question bank: replace existing questions for this category with freshly synced ones
      setQuestions(prev => {
        const remaining = prev.filter(q => q.targetCategory !== category);
        return [...taggedQuestions, ...remaining];
      });

      const nowIso = new Date().toISOString();
      const nowFormatted = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

      setCategoryAirtableConfigs(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          lastSyncedAt: nowIso,
          questionCount: taggedQuestions.length
        }
      }));

      setLastAutoSyncTime(nowFormatted);
      setAutoSyncStatus({
        success: true,
        message: `${taggedQuestions.length} perguntas sincronizadas com sucesso para ${category}!`,
        timestamp: nowIso
      });

      return {
        success: true,
        count: taggedQuestions.length,
        message: `Sincronizadas com sucesso ${taggedQuestions.length} perguntas para ${category}.`
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: err?.message || 'Falha na ligação com a API do Airtable.'
      };
    } finally {
      setIsSyncingAirtable(false);
    }
  };

  /**
   * Syncs questions for ALL configured categories from Airtable
   */
  const syncAllCategoriesFromAirtable = async (
    tokenOverride?: string
  ): Promise<{ success: boolean; results: Record<string, number>; totalAdded: number; message: string }> => {
    const token = (tokenOverride || airtableToken || '').trim();
    if (!token) {
      return { 
        success: false, 
        results: {}, 
        totalAdded: 0, 
        message: 'Token de Acesso Pessoal (PAT) do Airtable em falta. Crie um token com permissão "data.records:read".' 
      };
    }

    setIsSyncingAirtable(true);
    const results: Record<string, number> = {};
    let totalAdded = 0;
    const errors: string[] = [];

    try {
      for (const cat of ALL_DRIVER_CATEGORIES) {
        const cfg = categoryAirtableConfigs[cat];
        if (!cfg?.baseId || !cfg?.tableIdOrName) continue;

        try {
          const res = await fetchQuestionsFromAirtableApi(token, cfg.baseId, cfg.tableIdOrName, cat);
          if (res.questions.length > 0) {
            const tagged = res.questions.map(q => ({ ...q, targetCategory: cat }));
            results[cat] = tagged.length;
            totalAdded += tagged.length;

            setQuestions(prev => {
              const remaining = prev.filter(q => q.targetCategory !== cat);
              return [...tagged, ...remaining];
            });

            setCategoryAirtableConfigs(prev => ({
              ...prev,
              [cat]: {
                ...prev[cat],
                lastSyncedAt: new Date().toISOString(),
                questionCount: tagged.length
              }
            }));
          }
        } catch (catErr: any) {
          errors.push(`${cat}: ${catErr?.message || 'Erro'}`);
        }
      }

      const nowFormatted = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      setLastAutoSyncTime(nowFormatted);

      if (totalAdded === 0 && errors.length > 0) {
        return {
          success: false,
          results,
          totalAdded: 0,
          message: `Não foi possível sincronizar: ${errors[0]}`
        };
      }

      return {
        success: true,
        results,
        totalAdded,
        message: `Sincronização global concluída! Total de ${totalAdded} perguntas atualizadas a partir do Airtable.`
      };
    } finally {
      setIsSyncingAirtable(false);
    }
  };

  /**
   * Automatic background periodic sync:
   * Every 3 minutes (180s), if a valid PAT token exists, automatically poll Airtable
   * and refresh questions without user intervention so questions are always up to date.
   */
  useEffect(() => {
    if (!airtableToken || airtableToken.length < 10) return;

    const intervalId = setInterval(async () => {
      const activeCategories = ALL_DRIVER_CATEGORIES.filter(cat => {
        const cfg = categoryAirtableConfigs[cat];
        return cfg && cfg.autoSync && cfg.baseId && cfg.tableIdOrName;
      });

      if (activeCategories.length === 0) return;

      try {
        for (const cat of activeCategories) {
          const cfg = categoryAirtableConfigs[cat];
          try {
            const res = await fetchQuestionsFromAirtableApi(airtableToken, cfg.baseId, cfg.tableIdOrName, cat);
            if (res.questions.length > 0) {
              const tagged = res.questions.map(q => ({ ...q, targetCategory: cat }));
              setQuestions(prev => {
                const remaining = prev.filter(q => q.targetCategory !== cat);
                return [...tagged, ...remaining];
              });

              setCategoryAirtableConfigs(prev => ({
                ...prev,
                [cat]: {
                  ...prev[cat],
                  lastSyncedAt: new Date().toISOString(),
                  questionCount: tagged.length
                }
              }));
            }
          } catch {
            // Background silent catch to not disrupt user experience
          }
        }
        setLastAutoSyncTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
      } catch {
        // Ignore background timer errors
      }
    }, 180000); // 3 minutes

    return () => clearInterval(intervalId);
  }, [airtableToken, categoryAirtableConfigs]);

  const login = async (email: string, role: 'student' | 'admin' = 'student'): Promise<boolean> => {
    let existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      existing = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role,
        subscriptionStatus: role === 'admin' ? 'active_pro' : 'free_trial',
        freeTestCompleted: false,
        enrolledCategory: 'Categoria B',
        createdAt: new Date().toISOString(),
        seenQuestionIds: []
      };
      setUsers(prev => [...prev, existing!]);
    }
    setCurrentUser(existing);
    return true;
  };

  const loginWithGoogle = async (preferredCategory: DriverCategory = 'Categoria B'): Promise<boolean> => {
    const googleEmail = 'aluno.google@gmail.com';
    let user = users.find(u => u.email === googleEmail);
    if (!user) {
      user = {
        id: `user-google-${Date.now()}`,
        name: 'Aluno Google',
        email: googleEmail,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: 'student',
        subscriptionStatus: 'free_trial',
        freeTestCompleted: false,
        enrolledCategory: preferredCategory,
        createdAt: new Date().toISOString(),
        seenQuestionIds: []
      };
      setUsers(prev => [...prev, user!]);
    } else {
      user = { ...user, enrolledCategory: preferredCategory };
      setUsers(prev => prev.map(u => u.id === user!.id ? user! : u));
    }
    setCurrentUser(user);
    return true;
  };

  const register = async (
    name: string, 
    email: string, 
    category: DriverCategory, 
    nif?: string
  ): Promise<boolean> => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      nif,
      role: 'student',
      subscriptionStatus: 'free_trial',
      freeTestCompleted: false,
      enrolledCategory: category,
      createdAt: new Date().toISOString(),
      seenQuestionIds: []
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (role: 'student' | 'admin') => {
    const target = users.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
    } else {
      const fallback = DEFAULT_USERS.find(u => u.role === role) || DEFAULT_USERS[0];
      setCurrentUser(fallback);
    }
  };

  const completeExam = (data: Omit<ExamAttempt, 'id' | 'userId' | 'date'>): ExamAttempt => {
    if (!currentUser) throw new Error('Utilizador não autenticado.');

    const newAttempt: ExamAttempt = {
      ...data,
      id: `attempt-${Date.now()}`,
      userId: currentUser.id,
      date: new Date().toISOString(),
      driverCategory: currentUser.enrolledCategory
    };

    const updatedSeen = Array.from(new Set([...currentUser.seenQuestionIds, ...data.questionIds]));
    const updatedUser: User = {
      ...currentUser,
      seenQuestionIds: updatedSeen,
      freeTestCompleted: true
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setAttempts(prev => [newAttempt, ...prev]);

    return newAttempt;
  };

  const subscribePro = async (details: { 
    paymentMethod: 'Stripe Card' | 'MB WAY' | 'Multibanco' | 'Apple Pay'; 
    nif?: string; 
    cardLast4?: string 
  }): Promise<BillingInvoice> => {
    if (!currentUser) throw new Error('Utilizador não autenticado.');

    const invoiceNum = `FT-2026/${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: BillingInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userNif: details.nif || currentUser.nif || '999999990',
      amount: 5.00,
      currency: 'EUR',
      date: new Date().toISOString(),
      paymentMethod: details.paymentMethod,
      status: 'pago',
      stripePaymentId: `pi_stripe_${Date.now()}`
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updatedUser: User = {
      ...currentUser,
      subscriptionStatus: 'active_pro',
      nif: details.nif || currentUser.nif,
      subscriptionExpiresAt: expiresAt.toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    return newInvoice;
  };

  const importQuestions = (newQuestions: Question[]): number => {
    let affectedCount = 0;
    setQuestions(prev => {
      const updated = [...prev];
      newQuestions.forEach(newQ => {
        const normNewQuestion = newQ.question.toLowerCase().trim();
        const existingIdx = updated.findIndex(
          q => (newQ.id && q.id === newQ.id) || q.question.toLowerCase().trim() === normNewQuestion
        );

        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...newQ
          };
          affectedCount++;
        } else {
          updated.unshift(newQ);
          affectedCount++;
        }
      });
      return updated;
    });
    return affectedCount;
  };

  const addQuestion = (data: Omit<Question, 'id'>): Question => {
    const newQ: Question = {
      ...data,
      id: `q-custom-${Date.now()}`
    };
    setQuestions(prev => [newQ, ...prev]);
    return newQ;
  };

  const updateQuestion = (updated: Question) => {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const getUserAttempts = (userId?: string): ExamAttempt[] => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return [];
    return attempts.filter(a => a.userId === targetId);
  };

  const getCategoryPerformance = (userId?: string): CategoryPerformance[] => {
    const userAttempts = getUserAttempts(userId);
    const categoryStats: Record<string, { total: number; correct: number }> = {
      'Sinais de Trânsito': { total: 0, correct: 0 },
      'Regras de Prioridade e Cruzamentos': { total: 0, correct: 0 },
      'Velocidades e Distâncias': { total: 0, correct: 0 },
      'Manobras e Vias Especiais': { total: 0, correct: 0 },
      'Segurança Rodoviária, Luzes e Álcool': { total: 0, correct: 0 },
      'Mecânica Básica e Equipamentos': { total: 0, correct: 0 }
    };

    const questionMap = new Map<string, Question>();
    questions.forEach(q => questionMap.set(q.id, q));

    userAttempts.forEach(attempt => {
      Object.entries(attempt.answers).forEach(([qId, chosenIndex]) => {
        const q = questionMap.get(qId);
        if (q && categoryStats[q.category]) {
          categoryStats[q.category].total += 1;
          if (chosenIndex === q.correctAnswer) {
            categoryStats[q.category].correct += 1;
          }
        }
      });
    });

    return Object.entries(categoryStats).map(([cat, stats]) => ({
      category: cat as QuestionCategory,
      totalAnswered: stats.total,
      correct: stats.correct,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    }));
  };

  const getOverallReadiness = (userId?: string): number => {
    const performances = getCategoryPerformance(userId);
    const active = performances.filter(p => p.totalAnswered > 0);
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / active.length);
  };

  const refundInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'reembolsado' as const };
      }
      return inv;
    }));
  };

  const updateUserSubscription = (userId: string, status: SubscriptionStatus) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, subscriptionStatus: status };
      }
      return u;
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, subscriptionStatus: status } : null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        questions,
        attempts,
        invoices,
        categoryConfigs,
        categoryAirtableConfigs,
        airtableToken,
        isSyncingAirtable,
        lastAutoSyncTime,
        autoSyncStatus,
        setAirtableToken,
        updateCategoryConfig,
        resetCategoryConfigs,
        updateCategoryAirtableConfig,
        syncCategoryFromAirtable,
        syncAllCategoriesFromAirtable,
        updateUserCategory,
        login,
        loginWithGoogle,
        register,
        logout,
        switchRole,
        completeExam,
        subscribePro,
        importQuestions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        clearAllQuestions,
        resetToZero,
        getUserAttempts,
        getCategoryPerformance,
        getOverallReadiness,
        refundInvoice,
        updateUserSubscription
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
