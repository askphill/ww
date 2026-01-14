import {useEffect} from 'react';
import {Button} from '@wakey/ui';

interface ErrorFallbackProps {
  error?: Error | unknown;
  errorStatus?: number;
}

export function ErrorFallback({error, errorStatus = 500}: ErrorFallbackProps) {
  // Log error to console for debugging
  useEffect(() => {
    if (error) {
      console.error('ErrorFallback caught an error:', error);
    }
  }, [error]);

  // User-friendly messages based on status code
  const getMessage = () => {
    switch (errorStatus) {
      case 404:
        return {
          title: 'Page not found',
          description: "We couldn't find the page you're looking for.",
        };
      case 500:
        return {
          title: 'Something went wrong',
          description:
            "We're having some trouble on our end. Please try again later.",
        };
      default:
        return {
          title: 'Oops!',
          description: 'Something unexpected happened. Please try again.',
        };
    }
  };

  const {title, description} = getMessage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h1 className="text-h1 font-display mb-4">{title}</h1>
      <p className="text-paragraph font-body text-black/70 mb-8 max-w-md">
        {description}
      </p>
      <Button to="/" variant="primary">
        Go Home
      </Button>
    </div>
  );
}
