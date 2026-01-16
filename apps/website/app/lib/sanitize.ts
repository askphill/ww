/**
 * Simple HTML sanitizer for edge runtime environments (Cloudflare Workers/Oxygen).
 *
 * This sanitizer:
 * - Removes script, style, iframe, object, embed, and form tags
 * - Removes javascript: and data: URL protocols
 * - Removes event handlers (onclick, onerror, etc.)
 * - Preserves safe HTML for formatting (p, br, strong, em, a, ul, li, etc.)
 *
 * For content from trusted sources like Shopify CMS (which already sanitizes content),
 * this provides defense-in-depth against XSS.
 */

// Tags that should be completely removed along with their content
const DANGEROUS_TAGS =
  /<(script|style|iframe|object|embed|form|meta|link|base)[^>]*>[\s\S]*?<\/\1>|<(script|style|iframe|object|embed|form|meta|link|base)[^>]*\/>/gi;

// Self-closing dangerous tags
const DANGEROUS_SELF_CLOSING =
  /<(script|style|iframe|object|embed|form|meta|link|base)[^>]*>/gi;

// Event handlers (onclick, onerror, onload, etc.)
const EVENT_HANDLERS = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;

// Dangerous URL protocols
const DANGEROUS_PROTOCOLS =
  /(href|src|action|formaction|poster|data)\s*=\s*["']?\s*(javascript|vbscript|data):/gi;

// Expression patterns that could execute code
const EXPRESSION_PATTERNS = /expression\s*\(/gi;

/**
 * Sanitizes HTML input to prevent XSS attacks.
 * Works in edge runtime environments without DOM dependencies.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string, or empty string if input is null/undefined
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (html == null) {
    return '';
  }

  let sanitized = html;

  // Remove dangerous tags with content
  sanitized = sanitized.replace(DANGEROUS_TAGS, '');

  // Remove any remaining dangerous self-closing tags
  sanitized = sanitized.replace(DANGEROUS_SELF_CLOSING, '');

  // Remove event handlers
  sanitized = sanitized.replace(EVENT_HANDLERS, '');

  // Remove dangerous URL protocols
  sanitized = sanitized.replace(DANGEROUS_PROTOCOLS, '$1=""');

  // Remove CSS expression patterns
  sanitized = sanitized.replace(EXPRESSION_PATTERNS, '');

  return sanitized;
}
