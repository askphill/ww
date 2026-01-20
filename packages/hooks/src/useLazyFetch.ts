import {useFetcher} from 'react-router';
import {useEffect} from 'react';

interface UseLazyFetchOptions {
  /** Disable the fetch entirely (useful when data is already provided) */
  enabled?: boolean;
}

/**
 * Hook for lazy-loading data from an API route.
 * Automatically loads data on mount when idle and no data exists.
 *
 * @param path - The API path to fetch from (e.g., `/api/product/deodorant`)
 * @returns The fetcher object with state and data
 */
export function useLazyFetch<T = unknown>(
  path: string,
  options: UseLazyFetchOptions = {},
) {
  const fetcher = useFetcher<T>();
  const {enabled = true} = options;

  useEffect(() => {
    if (!enabled) return;

    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(path);
    }
  }, [enabled, path, fetcher]);

  return fetcher;
}
