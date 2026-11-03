import { Question } from '../types';

/**
 * Clean empty question bank by default.
 * Questions are populated via Airtable synchronization or manual input by administrator.
 */
export const INITIAL_QUESTIONS: Question[] = [];
