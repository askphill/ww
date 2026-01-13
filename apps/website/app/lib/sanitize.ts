import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML input to prevent XSS attacks.
 * Uses DOMPurify under the hood with isomorphic support for SSR.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string, or empty string if input is null/undefined
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (html == null) {
    return '';
  }
  return DOMPurify.sanitize(html);
}
