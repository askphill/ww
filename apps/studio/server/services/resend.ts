import {Resend} from 'resend';

export async function sendMagicLinkEmail(
  apiKey: string,
  email: string,
  token: string,
  appUrl: string,
): Promise<void> {
  const resend = new Resend(apiKey);

  const magicLink = `${appUrl}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: 'Wakey Admin <wakey@send.paul.studio>',
    to: email,
    subject: 'Sign in to Wakey Admin',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Sign in to Wakey Admin</h1>
        <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
        <a href="${magicLink}" style="display: inline-block; background-color: #F4B400; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
          Sign In
        </a>
        <p style="color: #666; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
      </div>
    `,
  });
}
