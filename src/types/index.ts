export type QuestionCategory =
  | 'Sinais de Trânsito'
  | 'Regras de Prioridade e Cruzamentos'
  | 'Velocidades e Distâncias'
  | 'Manobras e Vias Especiais'
  | 'Segurança Rodoviária, Luzes e Álcool'
  | 'Mecânica Básica e Equipamentos';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Official categories & professional courses requested:
 * (Categoria A1, Categoria A, Categoria B, Curso Instrutores de Condução Automóvel, Curso de Diretor de Escola de Condução, Curso TVDE)
 */
export type DriverCategory =
  | 'Categoria A1'
  | 'Categoria A'
  | 'Categoria B'
  | 'Curso Instrutores de Condução Automóvel'
  | 'Curso de Diretor de Escola de Condução'
  | 'Curso TVDE';

export const ALL_DRIVER_CATEGORIES: DriverCategory[] = [
  'Categoria A1',
  'Categoria A',
  'Categoria B',
  'Curso Instrutores de Condução Automóvel',
  'Curso de Diretor de Escola de Condução',
  'Curso TVDE'
];

export interface CategoryExamConfig {
  category: DriverCategory;
  name: string;
  shortName: string;
  totalQuestions: number;
  durationMinutes: number;
  minCorrectToPass: number;
  description: string;
  badgeColor?: string;
}

export interface Question {
  id: string;
  question: string;
  imageUrl: string;
  imageCaption?: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2
  category: QuestionCategory;
  targetCategory?: DriverCategory | 'Todas as Categorias';
  explanation: string;
  lawArticle?: string;
  difficulty: QuestionDifficulty;
  failureRate?: number; // e.g. 54% failure rate
}

export type SubscriptionStatus = 'free_trial' | 'active_pro' | 'canceled';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin';
  subscriptionStatus: SubscriptionStatus;
  freeTestCompleted: boolean;
  enrolledCategory: DriverCategory; // required at registration
  nif?: string;
  subscriptionExpiresAt?: string;
  createdAt: string;
  seenQuestionIds: string[];
}

export interface ExamAttempt {
  id: string;
  userId: string;
  date: string;
  mode: 'global' | 'theme' | 'hardest';
  category?: QuestionCategory;
  driverCategory?: DriverCategory;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  passed: boolean;
  timeSpentSeconds: number;
  answers: Record<string, number>; // questionId -> chosen index
  questionIds: string[];
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userNif?: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: 'Stripe Card' | 'MB WAY' | 'Multibanco' | 'Apple Pay';
  status: 'pago' | 'reembolsado';
  stripePaymentId: string;
}

export interface CategoryPerformance {
  category: QuestionCategory;
  totalAnswered: number;
  correct: number;
  percentage: number;
}
