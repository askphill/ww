import type {Answers} from '~/hooks/useAssistantFlow';

/**
 * Recommendation result returned by getRecommendation.
 */
export interface Recommendation {
  /** Shopify product handle */
  productHandle: string;
  /** Recommended quantity based on lifestyle count */
  quantity: number;
  /** Discount percentage based on quantity */
  discountPercent: number;
}

/**
 * Calculate personalized product recommendation based on user answers.
 *
 * For MVP, always recommends the 'deodorant' product.
 * Quantity is based on lifestyle selections (1 lifestyle = 1, 2+ = 2, 3+ = 3).
 * Discount scales with quantity (5% for 1, 10% for 2, 15% for 3+).
 *
 * @param answers - The user's answers from the assistant flow
 * @returns Recommendation with product handle, quantity, and discount
 */
export function getRecommendation(answers: Answers): Recommendation {
  // For MVP, always recommend deodorant
  const productHandle = 'deodorant';

  // Get lifestyle selections (multi-choice step returns string array)
  const lifestyleSelections = answers['lifestyle'];
  const lifestyleCount = Array.isArray(lifestyleSelections)
    ? lifestyleSelections.length
    : 0;

  // Calculate quantity based on lifestyle count
  // 1 lifestyle = 1, 2 lifestyles = 2, 3+ lifestyles = 3
  let quantity: number;
  if (lifestyleCount <= 1) {
    quantity = 1;
  } else if (lifestyleCount === 2) {
    quantity = 2;
  } else {
    quantity = 3;
  }

  // Calculate discount based on quantity
  // qty 1 = 5%, qty 2 = 10%, qty 3+ = 15%
  let discountPercent: number;
  if (quantity === 1) {
    discountPercent = 5;
  } else if (quantity === 2) {
    discountPercent = 10;
  } else {
    discountPercent = 15;
  }

  return {
    productHandle,
    quantity,
    discountPercent,
  };
}
