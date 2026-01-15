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

/**
 * Data structure for the shareable routine (minimal subset for URL encoding).
 */
export interface ShareableRoutine {
  /** User's name */
  n: string;
  /** Selected lifestyle preferences */
  l: string[];
  /** Recommended product handle */
  p: string;
  /** Quantity */
  q: number;
  /** Discount percentage */
  d: number;
}

/**
 * Encode routine data to a base64 string for URL sharing.
 *
 * @param name - User's name
 * @param lifestyles - Selected lifestyle preferences
 * @param productHandle - Recommended product handle
 * @param quantity - Recommended quantity
 * @param discountPercent - Discount percentage
 * @returns Base64-encoded string
 */
export function encodeRoutineForSharing(
  name: string,
  lifestyles: string[],
  productHandle: string,
  quantity: number,
  discountPercent: number,
): string {
  const data: ShareableRoutine = {
    n: name,
    l: lifestyles,
    p: productHandle,
    q: quantity,
    d: discountPercent,
  };

  // Use JSON + base64 encoding (URL-safe)
  const jsonString = JSON.stringify(data);
  // Use encodeURIComponent for special characters, then btoa for base64
  const base64 = btoa(encodeURIComponent(jsonString));
  // Make URL-safe by replacing + with - and / with _
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a base64-encoded routine from a URL parameter.
 *
 * @param encoded - Base64-encoded string from URL
 * @returns Decoded routine data, or null if invalid
 */
export function decodeRoutineFromSharing(
  encoded: string,
): ShareableRoutine | null {
  try {
    // Restore base64 characters that were made URL-safe
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padding = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padding);

    const jsonString = decodeURIComponent(atob(base64));
    const data = JSON.parse(jsonString) as ShareableRoutine;

    // Validate required fields
    if (
      typeof data.n !== 'string' ||
      !Array.isArray(data.l) ||
      typeof data.p !== 'string' ||
      typeof data.q !== 'number' ||
      typeof data.d !== 'number'
    ) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Unable to decode routine from URL:', error);
    return null;
  }
}

/**
 * Generate a shareable URL for a routine.
 *
 * @param name - User's name
 * @param lifestyles - Selected lifestyle preferences
 * @param productHandle - Recommended product handle
 * @param quantity - Recommended quantity
 * @param discountPercent - Discount percentage
 * @returns Full URL for sharing
 */
export function generateShareableUrl(
  name: string,
  lifestyles: string[],
  productHandle: string,
  quantity: number,
  discountPercent: number,
): string {
  const encoded = encodeRoutineForSharing(
    name,
    lifestyles,
    productHandle,
    quantity,
    discountPercent,
  );
  // Use relative path that can work on any domain
  return `/routine/${encoded}`;
}
