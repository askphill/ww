import {Hono} from 'hono';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {emailTemplates} from '../db/schema';
import {authMiddleware} from '../middleware/auth';
import {eq} from 'drizzle-orm';
import type {AppVariables, Env} from '../index';

const emailRoutes = new Hono<{Bindings: Env; Variables: AppVariables}>();

// Apply auth middleware to all routes
emailRoutes.use('*', authMiddleware);

// List all templates
emailRoutes.get('/templates', async (c) => {
  const db = createDb(c.env.DB);
  const templates = await db.select().from(emailTemplates);
  return c.json(templates);
});

// Get single template
emailRoutes.get('/templates/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({error: 'Invalid template ID'}, 400);
  }

  const db = createDb(c.env.DB);
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id));

  if (!template) {
    return c.json({error: 'Template not found'}, 404);
  }

  return c.json(template);
});

// Create template
const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sections: z.string(), // JSON string
});

emailRoutes.post(
  '/templates',
  zValidator('json', createTemplateSchema),
  async (c) => {
    const data = c.req.valid('json');
    const db = createDb(c.env.DB);

    const [template] = await db
      .insert(emailTemplates)
      .values({
        name: data.name,
        description: data.description,
        sections: data.sections,
      })
      .returning();

    return c.json(template, 201);
  },
);

// Update template
const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sections: z.string().optional(),
});

emailRoutes.put(
  '/templates/:id',
  zValidator('json', updateTemplateSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({error: 'Invalid template ID'}, 400);
    }

    const data = c.req.valid('json');
    const db = createDb(c.env.DB);

    const [existing] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));

    if (!existing) {
      return c.json({error: 'Template not found'}, 404);
    }

    const [template] = await db
      .update(emailTemplates)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(emailTemplates.id, id))
      .returning();

    return c.json(template);
  },
);

// Delete template
emailRoutes.delete('/templates/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({error: 'Invalid template ID'}, 400);
  }

  const db = createDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id));

  if (!existing) {
    return c.json({error: 'Template not found'}, 404);
  }

  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));

  return c.json({success: true});
});

// Duplicate template
emailRoutes.post('/templates/:id/duplicate', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({error: 'Invalid template ID'}, 400);
  }

  const db = createDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id));

  if (!existing) {
    return c.json({error: 'Template not found'}, 404);
  }

  const [template] = await db
    .insert(emailTemplates)
    .values({
      name: `${existing.name} (Copy)`,
      description: existing.description,
      sections: existing.sections,
    })
    .returning();

  return c.json(template, 201);
});

export {emailRoutes};
