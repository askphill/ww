import {useState, useEffect} from 'react';

/**
 * SSR-safe hook to detect if a media query matches.
 * Returns false during SSR and updates on client mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Returns true when viewport is at least 768px (md breakpoint)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
