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
  ALL_DRIVER_CATEGORIES
} from '../types';
import { INITIAL_QUESTIONS } from '../data/initialQuestions';

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

interface AppContextType {
  currentUser: User | null;
  users: User[];
  questions: Question[];
  attempts: ExamAttempt[];
  invoices: BillingInvoice[];
  categoryConfigs: Record<DriverCategory, CategoryExamConfig>;
  updateCategoryConfig: (config: CategoryExamConfig) => void;
  resetCategoryConfigs: () => void;
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
  getUserAttempts: (userId?: string) => ExamAttempt[];
  getCategoryPerformance: (userId?: string) => CategoryPerformance[];
  getOverallReadiness: (userId?: string) => number;
  refundInvoice: (invoiceId: string) => void;
  updateUserSubscription: (userId: string, status: SubscriptionStatus) => void;
}

const STORAGE_KEY_PREFIX = 'condutorpro_';

const DEFAULT_USERS: User[] = [
  {
    id: 'user-student-1',
    name: 'João Silva',
    email: 'aluno@condutorpro.pt',
    role: 'student',
    subscriptionStatus: 'free_trial',
    freeTestCompleted: false,
    enrolledCategory: 'Categoria B',
    nif: '254890123',
    createdAt: '2026-10-15T10:00:00Z',
    seenQuestionIds: []
  },
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

const DEFAULT_INVOICES: BillingInvoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'FT-2026/089',
    userId: 'user-student-2',
    userName: 'Mariana Costa',
    userEmail: 'mariana.costa@gmail.com',
    userNif: '234567891',
    amount: 5.00,
    currency: 'EUR',
    date: '2026-10-28T14:22:00Z',
    paymentMethod: 'Stripe Card',
    status: 'pago',
    stripePaymentId: 'pi_3Nx809qLkjhd123'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'FT-2026/090',
    userId: 'user-student-3',
    userName: 'Tiago Ferreira',
    userEmail: 't.ferreira99@sapo.pt',
    userNif: '267891234',
    amount: 5.00,
    currency: 'EUR',
    date: '2026-10-29T09:15:00Z',
    paymentMethod: 'MB WAY',
    status: 'pago',
    stripePaymentId: 'pi_3Nx810qLkjhd456'
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'FT-2026/091',
    userId: 'user-student-4',
    userName: 'Beatriz Santos',
    userEmail: 'beatriz.santos@outlook.pt',
    userNif: '289012345',
    amount: 5.00,
    currency: 'EUR',
    date: '2026-10-30T16:40:00Z',
    paymentMethod: 'Stripe Card',
    status: 'pago',
    stripePaymentId: 'pi_3Nx811qLkjhd789'
  },
  {
    id: 'inv-1004',
    invoiceNumber: 'FT-2026/092',
    userId: 'user-student-5',
    userName: 'Pedro Rodrigues',
    userEmail: 'pedro.rodrigues@gmail.com',
    userNif: '211223344',
    amount: 5.00,
    currency: 'EUR',
    date: '2026-10-31T01:10:00Z',
    paymentMethod: 'Multibanco',
    status: 'pago',
    stripePaymentId: 'pi_3Nx812qLkjhd999'
  }
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((u: any) => ({
          ...u,
          enrolledCategory: u.enrolledCategory || 'Categoria B'
        }));
      } catch {
        return DEFAULT_USERS;
      }
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}currentUser`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          enrolledCategory: parsed.enrolledCategory || 'Categoria B'
        };
      } catch {
        return DEFAULT_USERS[0];
      }
    }
    return DEFAULT_USERS[0];
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}questions`);
    if (saved) {
      try {
        const parsed: Question[] = JSON.parse(saved);
        return parsed.map(q => ({
          ...q,
          targetCategory: q.targetCategory || 'Todas as Categorias'
        }));
      } catch {
        return INITIAL_QUESTIONS.map(q => ({ ...q, targetCategory: 'Todas as Categorias' }));
      }
    }
    return INITIAL_QUESTIONS.map(q => ({ ...q, targetCategory: 'Todas as Categorias' }));
  });

  const [attempts, setAttempts] = useState<ExamAttempt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}attempts`);
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<BillingInvoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}invoices`);
    return saved ? JSON.parse(saved) : DEFAULT_INVOICES;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}categoryConfigs`, JSON.stringify(categoryConfigs));
  }, [categoryConfigs]);

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

  const updateUserCategory = (category: DriverCategory, userId?: string) => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;
    setUsers(prev => prev.map(u => u.id === targetId ? { ...u, enrolledCategory: category } : u));
    if (currentUser && currentUser.id === targetId) {
      setCurrentUser(prev => prev ? { ...prev, enrolledCategory: category } : null);
    }
  };

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

    // Update student's seen questions & free trial flag
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

    const invoiceNum = `FT-2026/${String(invoices.length + 93).padStart(3, '0')}`;
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
    let addedCount = 0;
    setQuestions(prev => {
      const existingTextMap = new Set(prev.map(q => q.question.toLowerCase().trim()));
      const toAdd = newQuestions.filter(q => !existingTextMap.has(q.question.toLowerCase().trim()));
      addedCount = toAdd.length;
      return [...toAdd, ...prev];
    });
    return addedCount;
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
        updateCategoryConfig,
        resetCategoryConfigs,
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
