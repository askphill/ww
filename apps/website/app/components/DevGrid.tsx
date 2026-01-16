/**
 * Development grid overlay for alignment
 * Uses var(--spacing) from Tailwind theme
 * Press 'g' to toggle visibility
 */
import {useEffect, useState} from 'react';

export function DevGrid() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Ignore if user is typing in an input
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Only show in development mode
  if (!import.meta.env.DEV) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setVisible((v) => !v)}
        className="fixed bottom-4 left-4 z-[10000] flex h-8 w-8 items-center justify-center rounded bg-red-500/80 font-mono text-small text-white transition-opacity hover:bg-red-500"
        title={`Toggle grid (g)`}
        aria-label="Toggle development grid"
      >
        G
      </button>

      {/* Grid overlay */}
      {visible && (
        <div
          className="pointer-events-none fixed inset-0 z-[9999] px-4 md:px-8"
          aria-hidden="true"
        >
          <div className="mx-auto grid h-full w-full grid-cols-12 gap-0 md:grid-cols-24">
            {Array.from({length: 24}).map((_, i) => (
              <div
                key={i}
                className={`relative h-full border-x border-red-500/30 ${i >= 12 ? 'hidden md:block' : ''}`}
              >
                <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-red-500/80 px-1 text-[10px] font-mono text-white">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
