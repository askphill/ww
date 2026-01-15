import type { ZodSchema } from 'zod';

/**
 * Safely parses a JSON string using a Zod schema.
 * Returns null if parsing fails or schema validation fails, instead of throwing.
 *
 * @param json - The JSON string to parse
 * @param schema - The Zod schema to validate against
 * @returns The parsed data if valid, or null
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  schema: ZodSchema<T>,
): T | null {
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }
    return null;
  } catch {
    return null;
  }
}
