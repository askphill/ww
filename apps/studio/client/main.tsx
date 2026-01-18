import {StrictMode, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {App} from './App';
import {useDarkMode} from './hooks/useDarkMode';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function DarkModeProvider({children}: {children: ReactNode}) {
  useDarkMode();
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <App />
      </DarkModeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
