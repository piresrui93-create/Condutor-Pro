import { Question, QuestionCategory, DriverCategory } from '../types';

export interface SelectionOptions {
  mode: 'global' | 'theme' | 'hardest';
  category?: QuestionCategory;
  driverCategory?: DriverCategory;
  seenQuestionIds: string[];
  count?: number; // default from category config
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Smart Question Selection Engine:
 * Filters by DriverCategory (or 'Todas as Categorias'), and prioritizes unseen questions.
 */
export function selectQuestions(allQuestions: Question[], options: SelectionOptions): Question[] {
  const { mode, category, driverCategory, seenQuestionIds, count = 30 } = options;
  const seenSet = new Set(seenQuestionIds || []);

  // Filter pool by Driver Category if specified
  let basePool = allQuestions;
  if (driverCategory) {
    const matching = allQuestions.filter(
      q => !q.targetCategory || q.targetCategory === 'Todas as Categorias' || q.targetCategory === driverCategory
    );
    if (matching.length > 0) {
      basePool = matching;
    }
  }

  let candidatePool: Question[] = [];

  if (mode === 'theme' && category) {
    candidatePool = basePool.filter(q => q.category === category);
  } else if (mode === 'hardest') {
    candidatePool = basePool.filter(q => q.difficulty === 'hard' || (q.failureRate && q.failureRate >= 40));
    // If not enough hard questions, add medium ones
    if (candidatePool.length < count) {
      const extra = basePool.filter(q => q.difficulty === 'medium' && !candidatePool.some(c => c.id === q.id));
      candidatePool = [...candidatePool, ...extra];
    }
  } else {
    // Global Official Exam for this category
    candidatePool = [...basePool];
  }

  if (candidatePool.length === 0) {
    candidatePool = [...allQuestions];
  }

  // Partition candidates into unseen and seen
  const unseen = candidatePool.filter(q => !seenSet.has(q.id));
  const seen = candidatePool.filter(q => seenSet.has(q.id));

  // Shuffle both sets for variety
  const shuffledUnseen = shuffleArray(unseen);
  const shuffledSeen = shuffleArray(seen);

  // Combine unseen first, then seen to reach target count
  let selected = [...shuffledUnseen];

  if (selected.length < count) {
    const needed = count - selected.length;
    selected = [...selected, ...shuffledSeen.slice(0, needed)];
  }

  // If candidatePool has fewer items than count in theme mode, return unique questions
  if (mode === 'theme') {
    return selected;
  }

  // If global exam mode and pool is smaller than count, fill with clone instances with distinct unique IDs
  if (selected.length < count && candidatePool.length > 0) {
    let repeatCounter = 1;
    while (selected.length < count) {
      const remainingNeeded = count - selected.length;
      const extra = shuffleArray(candidatePool).slice(0, remainingNeeded).map(q => ({
        ...q,
        id: `${q.id}_copy_${repeatCounter++}`
      }));
      selected = [...selected, ...extra];
    }
  }

  return selected.slice(0, count);
}
