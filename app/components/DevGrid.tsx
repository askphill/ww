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
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            to right,
            rgba(255, 0, 0, 0.1) 0,
            rgba(255, 0, 0, 0.1) 1px,
            transparent 1px,
            transparent calc(var(--spacing) * 4)
          )
        `,
      }}
    />
  );
}
