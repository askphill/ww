import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML string to prevent XSS attacks.
 * Uses isomorphic-dompurify which works in both Node (SSR) and Browser environments.
 *
 * @param html - The potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html);
}
