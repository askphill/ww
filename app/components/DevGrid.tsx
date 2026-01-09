/**
 * Development grid overlay for alignment
 * Uses var(--spacing) from Tailwind theme
 * Press 'g' to toggle visibility
 */
import {useEffect, useState} from 'react';

export function DevGrid() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] px-4 md:px-8"
      aria-hidden="true"
    >
      <div className="mx-auto grid h-full w-full grid-cols-12 gap-0 md:grid-cols-24">
        {Array.from({length: 24}).map((_, i) => (
          <div key={i} className={`h-full border-x border-red-500/30 bg-red-500/10 ${i >= 12 ? 'hidden md:block' : ''}`} />
        ))}
      </div>
    </div>
  );
}
