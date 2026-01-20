import {useState, useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';

interface UnsubscribeInfo {
  email: string;
  status: string;
  alreadyUnsubscribed: boolean;
}

interface UnsubscribeResponse extends Partial<UnsubscribeInfo> {
  error?: string;
  success?: boolean;
  message?: string;
}

type PageState = 'loading' | 'ready' | 'success' | 'error' | 'invalid';

export function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<PageState>('loading');
  const [info, setInfo] = useState<UnsubscribeInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch subscriber info on mount
  useEffect(() => {
    if (!token) {
      setState('invalid');
      setError('No unsubscribe token provided');
      return;
    }

    fetch(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => res.json() as Promise<UnsubscribeResponse>)
      .then((data) => {
        if (data.error) {
          setState('error');
          setError(data.error);
        } else if (data.alreadyUnsubscribed) {
          setState('success');
          setInfo(data as UnsubscribeInfo);
        } else {
          setState('ready');
          setInfo(data as UnsubscribeInfo);
        }
      })
      .catch(() => {
        setState('error');
        setError('Failed to verify unsubscribe link');
      });
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/email/unsubscribe?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
        },
      );

      const data = (await res.json()) as UnsubscribeResponse;

      if (data.error) {
        setError(data.error);
        setState('error');
      } else {
        setState('success');
      }
    } catch {
      setError('Failed to process unsubscribe request');
      setState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Wakey</h1>
          <p className="text-sm text-gray-500 mt-1">Email Preferences</p>
        </div>

        {/* Loading State */}
        {state === 'loading' && (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Verifying your request...</p>
          </div>
        )}

        {/* Invalid Token State */}
        {state === 'invalid' && (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Invalid Link
            </h2>
            <p className="text-gray-600">
              This unsubscribe link is invalid or missing required information.
            </p>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Something Went Wrong
            </h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              If this problem persists, please contact us at{' '}
              <a
                href="mailto:hello@wakey.care"
                className="text-orange-600 hover:underline"
              >
                hello@wakey.care
              </a>
            </p>
          </div>
        )}

        {/* Ready State - Show Confirmation */}
        {state === 'ready' && info && (
          <div className="text-center py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Unsubscribe from Wakey Emails
            </h2>
            <p className="text-gray-600 mb-6">
              You are about to unsubscribe <strong>{info.email}</strong> from
              our mailing list.
            </p>

            <button
              onClick={handleUnsubscribe}
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Unsubscribe'}
            </button>

            <p className="text-xs text-gray-500 mt-4">
              You can always re-subscribe on our website if you change your
              mind.
            </p>

            {/* No-JS Fallback Form */}
            <noscript>
              <form
                action={`/api/email/unsubscribe?token=${encodeURIComponent(token || '')}`}
                method="POST"
                className="mt-4"
              >
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700"
                >
                  Confirm Unsubscribe
                </button>
              </form>
            </noscript>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {info?.alreadyUnsubscribed
                ? 'Already Unsubscribed'
                : 'Successfully Unsubscribed'}
            </h2>
            <p className="text-gray-600">
              {info?.alreadyUnsubscribed
                ? `${info.email} was already unsubscribed from our mailing list.`
                : `${info?.email} has been unsubscribed from our mailing list.`}
            </p>
            <a
              href="https://www.wakey.care"
              className="inline-block mt-6 text-orange-600 hover:underline"
            >
              Visit Wakey.care
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-8">
        © {new Date().getFullYear()} Wakey. All rights reserved.
      </p>
    </div>
  );
}
