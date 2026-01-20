/**
 * Seed script for email components
 *
 * Seeds all 7 email components into the database with their schemas and default props.
 * This script is idempotent - running it multiple times will not create duplicates.
 *
 * Components seeded:
 * - Header
 * - Hero
 * - TextBlock
 * - CallToAction
 * - ProductGrid
 * - Footer
 * - Divider
 */

import {eq} from 'drizzle-orm';
import type {Database} from './index';
import {emailComponents} from './schema';

// Import schemas and default props from email components
import {
  HeaderSchema,
  HeaderDefaultProps,
  HeroSchema,
  HeroDefaultProps,
  TextBlockSchema,
  TextBlockDefaultProps,
  CallToActionSchema,
  CallToActionDefaultProps,
  ProductGridSchema,
  ProductGridDefaultProps,
  FooterSchema,
  FooterDefaultProps,
  DividerSchema,
  DividerDefaultProps,
} from '../email-components';

interface ComponentSeedData {
  name: string;
  type: string;
  schema: Record<string, unknown>;
  defaultProps: Record<string, unknown>;
}

// Define all components to seed
const componentsToSeed: ComponentSeedData[] = [
  {
    name: HeaderSchema.name,
    type: HeaderSchema.type,
    schema: HeaderSchema as unknown as Record<string, unknown>,
    defaultProps: HeaderDefaultProps as unknown as Record<string, unknown>,
  },
  {
    name: HeroSchema.name,
    type: HeroSchema.type,
    schema: HeroSchema as unknown as Record<string, unknown>,
    defaultProps: HeroDefaultProps as unknown as Record<string, unknown>,
  },
  {
    name: TextBlockSchema.name,
    type: TextBlockSchema.type,
    schema: TextBlockSchema as unknown as Record<string, unknown>,
    defaultProps: TextBlockDefaultProps as unknown as Record<string, unknown>,
  },
  {
    name: CallToActionSchema.name,
    type: CallToActionSchema.type,
    schema: CallToActionSchema as unknown as Record<string, unknown>,
    defaultProps: CallToActionDefaultProps as unknown as Record<
      string,
      unknown
    >,
  },
  {
    name: ProductGridSchema.name,
    type: ProductGridSchema.type,
    schema: ProductGridSchema as unknown as Record<string, unknown>,
    defaultProps: ProductGridDefaultProps as unknown as Record<string, unknown>,
  },
  {
    name: FooterSchema.name,
    type: FooterSchema.type,
    schema: FooterSchema as unknown as Record<string, unknown>,
    defaultProps: FooterDefaultProps as unknown as Record<string, unknown>,
  },
  {
    name: DividerSchema.name,
    type: DividerSchema.type,
    schema: DividerSchema as unknown as Record<string, unknown>,
    defaultProps: DividerDefaultProps as unknown as Record<string, unknown>,
  },
];

export interface SeedResult {
  inserted: number;
  skipped: number;
  total: number;
}

/**
 * Seeds email components into the database.
 *
 * This function is idempotent - it checks for existing components by type
 * before inserting, so running it multiple times won't create duplicates.
 *
 * @param db - Drizzle database instance
 * @returns Object with counts of inserted, skipped, and total components
 */
export async function seedEmailComponents(db: Database): Promise<SeedResult> {
  let inserted = 0;
  let skipped = 0;

  for (const component of componentsToSeed) {
    // Check if component already exists by type
    const existing = await db
      .select({id: emailComponents.id})
      .from(emailComponents)
      .where(eq(emailComponents.type, component.type))
      .get();

    if (existing) {
      console.log(`Skipping ${component.type} - already exists`);
      skipped++;
      continue;
    }

    // Insert new component
    await db.insert(emailComponents).values({
      name: component.name,
      type: component.type,
      schema: JSON.stringify(component.schema),
      defaultProps: JSON.stringify(component.defaultProps),
      reactEmailCode: null, // Not storing React code in DB - using registry instead
    });

    console.log(`Inserted ${component.type}`);
    inserted++;
  }

  return {
    inserted,
    skipped,
    total: componentsToSeed.length,
  };
}

/**
 * Updates existing email components with the latest schema and default props.
 * Use this when component definitions have changed.
 *
 * @param db - Drizzle database instance
 * @returns Number of components updated
 */
export async function updateEmailComponents(db: Database): Promise<number> {
  let updated = 0;

  for (const component of componentsToSeed) {
    // Check if component exists first
    const existing = await db
      .select({id: emailComponents.id})
      .from(emailComponents)
      .where(eq(emailComponents.type, component.type))
      .get();

    if (existing) {
      await db
        .update(emailComponents)
        .set({
          name: component.name,
          schema: JSON.stringify(component.schema),
          defaultProps: JSON.stringify(component.defaultProps),
        })
        .where(eq(emailComponents.type, component.type));

      console.log(`Updated ${component.type}`);
      updated++;
    }
  }

  return updated;
}

/**
 * Gets the list of component types that should be seeded.
 * Useful for verification.
 */
export function getComponentTypesToSeed(): string[] {
  return componentsToSeed.map((c) => c.type);
}
