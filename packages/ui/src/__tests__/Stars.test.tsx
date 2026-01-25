import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Stars} from '../Stars';

describe('Stars', () => {
  describe('rendering', () => {
    it('renders 5 stars', () => {
      render(<Stars rating={3} />);
      const svgs = document.querySelectorAll('svg');
      expect(svgs).toHaveLength(5);
    });

    it('renders in a flex container', () => {
      const {container} = render(<Stars rating={3} />);
      expect(container.firstChild).toHaveClass('flex', 'items-center');
    });
  });

  describe('rating display', () => {
    it('shows 0 filled stars for rating 0', () => {
      render(<Stars rating={0} />);
      const paths = document.querySelectorAll('path');
      // All 5 stars should be empty (opacity color)
      paths.forEach((path) => {
        expect(path.getAttribute('fill')).toContain('rgba');
      });
    });

    it('shows correct number of filled stars for whole numbers', () => {
      render(<Stars rating={3} />);
      const paths = document.querySelectorAll('path');

      // First 3 should be filled (solid color)
      for (let i = 0; i < 3; i++) {
        expect(paths[i].getAttribute('fill')).not.toContain('rgba');
      }
      // Last 2 should be empty
      for (let i = 3; i < 5; i++) {
        expect(paths[i].getAttribute('fill')).toContain('rgba');
      }
    });

    it('shows 5 filled stars for rating 5', () => {
      render(<Stars rating={5} />);
      const paths = document.querySelectorAll('path');
      paths.forEach((path) => {
        expect(path.getAttribute('fill')).not.toContain('rgba');
      });
    });

    it('handles half stars (rating 3.5)', () => {
      render(<Stars rating={3.5} />);
      // Should have a clipPath for the half star
      const clipPaths = document.querySelectorAll('clipPath');
      expect(clipPaths.length).toBeGreaterThan(0);
    });

    it('rounds down for values less than .5', () => {
      render(<Stars rating={3.4} />);
      // Should NOT have half star
      const clipPaths = document.querySelectorAll('clipPath');
      expect(clipPaths).toHaveLength(0);
    });

    it('shows half star for values >= .5', () => {
      render(<Stars rating={2.5} />);
      const clipPaths = document.querySelectorAll('clipPath');
      expect(clipPaths.length).toBeGreaterThan(0);
    });
  });

  describe('color variants', () => {
    it('uses sand color by default', () => {
      render(<Stars rating={3} />);
      const filledPath = document.querySelector('path');
      expect(filledPath?.getAttribute('fill')).toBe('#FFF5EB');
    });

    it('uses black color when specified', () => {
      render(<Stars rating={3} color="black" />);
      const filledPath = document.querySelector('path');
      expect(filledPath?.getAttribute('fill')).toBe('#1A1A1A');
    });
  });

  describe('size variants', () => {
    it('uses small size by default', () => {
      render(<Stars rating={3} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('w-3', 'h-3');
    });

    it('uses medium size when specified', () => {
      render(<Stars rating={3} size="md" />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('w-3.5', 'h-3.5');
    });
  });

  describe('edge cases', () => {
    it('handles rating above 5 gracefully', () => {
      render(<Stars rating={7} />);
      const svgs = document.querySelectorAll('svg');
      expect(svgs).toHaveLength(5);
    });

    it('handles negative rating gracefully', () => {
      render(<Stars rating={-1} />);
      const svgs = document.querySelectorAll('svg');
      expect(svgs).toHaveLength(5);
    });

    it('handles decimal ratings', () => {
      render(<Stars rating={4.7} />);
      const clipPaths = document.querySelectorAll('clipPath');
      expect(clipPaths.length).toBeGreaterThan(0);
    });
  });
});
