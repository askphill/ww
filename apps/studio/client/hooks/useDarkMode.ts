import {useEffect} from 'react';

export function useDarkMode() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(isDark: boolean) {
      document.documentElement.classList.toggle('dark', isDark);
    }

    // Apply initial theme
    applyTheme(mediaQuery.matches);

    // Listen for changes
    function handleChange(e: MediaQueryListEvent) {
      applyTheme(e.matches);
    }

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
}
