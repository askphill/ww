import type {ZodSchema} from 'zod';

/**
 * Safely parses a JSON string and validates it against a Zod schema.
 *
 * This utility provides defense-in-depth for JSON parsing:
 * - Returns null instead of throwing on JSON.parse errors
 * - Returns null instead of throwing on Zod validation errors
 * - Returns typed data when parsing and validation succeed
 *
 * @param json - The JSON string to parse
 * @param schema - A Zod schema to validate the parsed data against
 * @returns The validated data of type T, or null if parsing/validation fails
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  schema: ZodSchema<T>,
): T | null {
  if (json == null) {
    return null;
  }

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
