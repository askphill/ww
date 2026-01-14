import type {Answers} from '~/hooks/useAssistantFlow';
import type {Recommendation} from '~/lib/getRecommendation';

/**
 * The key used to store routine data in localStorage.
 */
export const ROUTINE_STORAGE_KEY = 'wakey_routine';

/**
 * Structure of routine data saved to localStorage.
 */
export interface SavedRoutine {
  /** User's name from the name-email step */
  name: string;
  /** User's email from the name-email step */
  email: string;
  /** All answers from the assistant flow */
  answers: Answers;
  /** The recommended product handle */
  recommendedProduct: string;
  /** The discount percentage for the recommendation */
  discountPercent: number;
  /** ISO timestamp when the routine was created */
  createdAt: string;
}

/**
 * Save the routine data to localStorage.
 *
 * @param name - User's name from the name-email step
 * @param email - User's email from the name-email step
 * @param answers - All answers from the assistant flow
 * @param recommendation - The recommendation calculated from answers
 */
export function saveRoutineToStorage(
  name: string,
  email: string,
  answers: Answers,
  recommendation: Recommendation,
): void {
  const routineData: SavedRoutine = {
    name,
    email,
    answers,
    recommendedProduct: recommendation.productHandle,
    discountPercent: recommendation.discountPercent,
    createdAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routineData));
    }
  } catch (error) {
    // Silently fail if localStorage is not available (SSR, private browsing, etc.)
    console.warn('Unable to save routine to localStorage:', error);
  }
}

/**
 * Load the routine data from localStorage.
 *
 * @returns The saved routine data, or null if not found or invalid
 */
export function loadRoutineFromStorage(): SavedRoutine | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(ROUTINE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as SavedRoutine;
      }
    }
  } catch (error) {
    // Silently fail if localStorage is not available or data is corrupted
    console.warn('Unable to load routine from localStorage:', error);
  }
  return null;
}

/**
 * Clear the routine data from localStorage.
 */
export function clearRoutineFromStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(ROUTINE_STORAGE_KEY);
    }
  } catch (error) {
    // Silently fail if localStorage is not available
    console.warn('Unable to clear routine from localStorage:', error);
  }
}
