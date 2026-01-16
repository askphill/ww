import {Hono} from 'hono';
import {setCookie, deleteCookie, getCookie} from 'hono/cookie';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {users, sessions, magicLinkTokens} from '../db/schema';
import {eq, and, gt, isNull} from 'drizzle-orm';
import {sendMagicLinkEmail} from '../services/resend';
import {authMiddleware} from '../middleware/auth';
import type {AppVariables, Env} from '../index';

const authRoutes = new Hono<{Bindings: Env; Variables: AppVariables}>();

// Allowed emails (whitelist)
const ALLOWED_EMAILS = ['bd@askphill.com', 'phill@askphill.com'];

function generateId(): string {
  return crypto.randomUUID();
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Send magic link
authRoutes.post(
  '/send-magic-link',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
    }),
  ),
  async (c) => {
    const {email} = c.req.valid('json');

    // Check whitelist
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      return c.json({error: 'Email not authorized'}, 403);
    }

    const db = createDb(c.env.DB);
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Create magic link token
    await db.insert(magicLinkTokens).values({
      id: generateId(),
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    // Send email
    await sendMagicLinkEmail(
      c.env.RESEND_API_KEY,
      email,
      token,
      c.env.VITE_APP_URL,
    );

    return c.json({success: true});
  },
);

// Verify magic link
authRoutes.get('/verify', async (c) => {
  const token = c.req.query('token');

  if (!token) {
    return c.redirect('/login?error=invalid_token');
  }

  const db = createDb(c.env.DB);

  // Find valid token
  const tokenResult = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.token, token),
        gt(magicLinkTokens.expiresAt, new Date().toISOString()),
        isNull(magicLinkTokens.usedAt),
      ),
    )
    .limit(1);

  const magicToken = tokenResult[0];

  if (!magicToken) {
    return c.redirect('/login?error=expired_token');
  }

  // Mark token as used
  await db
    .update(magicLinkTokens)
    .set({usedAt: new Date().toISOString()})
    .where(eq(magicLinkTokens.id, magicToken.id));

  // Find or create user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, magicToken.email))
    .limit(1)
    .then((r) => r[0]);

  if (!user) {
    const userId = generateId();
    await db.insert(users).values({
      id: userId,
      email: magicToken.email,
    });
    user = {
      id: userId,
      email: magicToken.email,
      createdAt: new Date().toISOString(),
    };
  }

  // Create session
  const sessionId = generateId();
  const sessionExpiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString(); // 30 days

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt: sessionExpiresAt,
  });

  // Set session cookie
  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  return c.redirect('/seo');
});

// Get current user
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({user});
});

// Logout
authRoutes.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session');

  if (sessionId) {
    const db = createDb(c.env.DB);
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  deleteCookie(c, 'session', {path: '/'});

  return c.json({success: true});
});

// Dev login (local only)
authRoutes.post('/dev-login', async (c) => {
  // Only allow in local development
  const url = new URL(c.req.url);
  if (
    !url.hostname.includes('localhost') &&
    !url.hostname.includes('127.0.0.1')
  ) {
    return c.json({error: 'Dev login only available locally'}, 403);
  }

  const db = createDb(c.env.DB);
  const devEmail = 'dev@localhost';

  // Find or create dev user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, devEmail))
    .limit(1)
    .then((r) => r[0]);

  if (!user) {
    const userId = generateId();
    await db.insert(users).values({
      id: userId,
      email: devEmail,
    });
    user = {id: userId, email: devEmail, createdAt: new Date().toISOString()};
  }

  // Create session
  const sessionId = generateId();
  const sessionExpiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt: sessionExpiresAt,
  });

  // Set session cookie
  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: false, // Allow non-HTTPS for localhost
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return c.json({success: true, user: {id: user.id, email: user.email}});
});

export {authRoutes};
