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
      className="pointer-events-none fixed inset-0 z-[9999] grid grid-cols-25 md:grid-cols-60"
      aria-hidden="true"
    >
      {Array.from({length: 60}).map((_, i) => (
        <div
          key={i}
          className={`h-full border-r border-red-500/10 ${i >= 25 ? 'hidden md:block' : ''}`}
        />
      ))}
    </div>
  );
}
