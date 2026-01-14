import {z} from 'zod';

/**
 * Environment variable schema with validation rules
 * Validates all required environment variables at runtime
 */
const envSchema = z.object({
  // Session secret must be at least 32 characters for security
  SESSION_SECRET: z
    .string({
      required_error: 'SESSION_SECRET environment variable is not set',
    })
    .min(32, {
      message:
        'SESSION_SECRET must be at least 32 characters long. Generate a secure secret with: openssl rand -base64 32',
    })
    .refine((val) => val !== 'foobar', {
      message:
        'SESSION_SECRET cannot be "foobar". Please set a secure, unique session secret.',
    }),

  // Public Storefront API token for client-side queries
  PUBLIC_STOREFRONT_API_TOKEN: z.string({
    required_error:
      'PUBLIC_STOREFRONT_API_TOKEN environment variable is not set. Run: npx shopify hydrogen env pull',
  }),

  // Store domain (e.g., your-store.myshopify.com)
  PUBLIC_STORE_DOMAIN: z.string({
    required_error:
      'PUBLIC_STORE_DOMAIN environment variable is not set. Run: npx shopify hydrogen env pull',
  }),

  // Optional variables (not required for startup)
  STORE: z.string().optional(),
  ADMIN_API_TOKEN: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validates environment variables against the schema
 * Throws descriptive error if validation fails
 *
 * @param env - The environment object to validate
 * @returns The validated environment object with proper types
 * @throws Error with descriptive message if validation fails
 */
export function validateEnv(env: Record<string, unknown>): ValidatedEnv {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}
