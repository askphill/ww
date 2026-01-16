import {Context, Next} from 'hono';
import {getCookie} from 'hono/cookie';
import {createDb} from '../db';
import {sessions, users} from '../db/schema';
import {eq, and, gt} from 'drizzle-orm';
import type {Env} from '../index';

export interface AuthUser {
  id: string;
  email: string;
}

export async function authMiddleware(
  c: Context<{Bindings: Env}>,
  next: Next,
): Promise<Response | void> {
  const sessionId = getCookie(c, 'session');

  if (!sessionId) {
    return c.json({error: 'Unauthorized'}, 401);
  }

  const db = createDb(c.env.DB);

  const result = await db
    .select({
      userId: sessions.userId,
      email: users.email,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  const session = result[0];

  if (!session) {
    return c.json({error: 'Session expired'}, 401);
  }

  // Attach user to context
  c.set('user', {id: session.userId, email: session.email} as AuthUser);

  await next();
}
