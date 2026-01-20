import {useState} from 'react';
import {Navigate, useSearchParams} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const {user, isLoading, sendMagicLink} = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/seo" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMagicLink.mutateAsync(email);
      setSent(true);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDevLogin = async () => {
    setDevLoading(true);
    setDevError(null);
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        window.location.href = '/seo';
      } else {
        const data = await res.json().catch(() => ({}));
        setDevError(data.error || `Login failed (${res.status})`);
      }
    } catch (e) {
      setDevError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Wakey Studio</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to access the dashboard
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-center text-sm text-destructive">
            {error === 'invalid_token' && 'Invalid or missing token'}
            {error === 'expired_token' && 'This link has expired'}
          </div>
        )}

        {sent ? (
          <div className="rounded-md bg-primary/10 p-6 text-center">
            <h2 className="text-lg font-medium text-foreground">
              Check your email
            </h2>
            <p className="mt-2 text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>

            {sendMagicLink.error && (
              <p className="text-sm text-destructive">
                {sendMagicLink.error.message}
              </p>
            )}

            <button
              type="submit"
              disabled={sendMagicLink.isPending}
              className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              {sendMagicLink.isPending ? 'Sending...' : 'Send magic link'}
            </button>

            {isLocalhost && (
              <>
                {devError && (
                  <p className="text-sm text-destructive">{devError}</p>
                )}
                <button
                  type="button"
                  onClick={handleDevLogin}
                  disabled={devLoading}
                  className="w-full rounded-md border border-input bg-background px-4 py-2 font-medium text-foreground shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                >
                  {devLoading ? 'Logging in...' : 'Dev Login (localhost only)'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
