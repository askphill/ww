import {useFetcher} from 'react-router';
import {useEffect} from 'react';

/**
 * Hook for lazy-loading data from an API route.
 * Automatically loads data on mount when idle and no data exists.
 *
 * @param path - The API path to fetch from (e.g., `/api/product/deodorant`)
 * @returns The fetcher object with state and data
 */
export function useLazyFetch<T = unknown>(path: string) {
  const fetcher = useFetcher<T>();

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(path);
    }
  }, [path, fetcher]);

  return fetcher;
}
