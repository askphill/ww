/**
 * Simple markdown parser for email content.
 * Supports a limited subset that works well in email clients:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - [link text](url)
 *
 * The order of parsing matters to avoid conflicts between * and **.
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses a limited markdown subset to HTML.
 * Safe for use in emails and React's dangerouslySetInnerHTML.
 *
 * @param markdown - The markdown string to parse
 * @param linkColor - Optional color for links (defaults to inherit)
 * @returns HTML string
 */
export function parseMarkdown(markdown: string, linkColor?: string): string {
  // First escape HTML to prevent XSS
  let html = escapeHtml(markdown);

  // Parse links first: [text](url)
  // Using a more careful regex to avoid matching nested brackets
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const style = linkColor
      ? `color: ${linkColor}; text-decoration: underline;`
      : 'text-decoration: underline;';
    return `<a href="${url}" style="${style}">${text}</a>`;
  });

  // Parse bold: **text** or __text__
  // Must come before italic to handle ** before *
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Parse italic: *text* or _text_
  // Using negative lookbehind/lookahead to avoid matching inside words for _
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');

  return html;
}

/**
 * Checks if a string contains any markdown syntax
 */
export function containsMarkdown(text: string): boolean {
  // Check for links
  if (/\[([^\]]+)\]\(([^)]+)\)/.test(text)) return true;
  // Check for bold
  if (/\*\*[^*]+\*\*/.test(text) || /__[^_]+__/.test(text)) return true;
  // Check for italic
  if (/\*[^*]+\*/.test(text) || /(?<!\w)_[^_]+_(?!\w)/.test(text)) return true;

  return false;
}
