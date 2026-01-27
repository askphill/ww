import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {Accordion} from '../Accordion';

const mockItems = [
  {id: '1', title: 'First Item', content: 'First content'},
  {id: '2', title: 'Second Item', content: 'Second content'},
  {id: '3', title: 'Third Item', content: 'Third content'},
];

describe('Accordion', () => {
  describe('rendering', () => {
    it('renders all items', () => {
      render(<Accordion items={mockItems} />);
      expect(screen.getByText('First Item')).toBeInTheDocument();
      expect(screen.getByText('Second Item')).toBeInTheDocument();
      expect(screen.getByText('Third Item')).toBeInTheDocument();
    });

    it('renders item content', () => {
      render(<Accordion items={mockItems} />);
      expect(screen.getByText('First content')).toBeInTheDocument();
    });
  });

  describe('default open behavior', () => {
    it('opens first item by default', () => {
      render(<Accordion items={mockItems} />);
      const firstButton = screen.getByText('First Item').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('respects defaultOpenIndex prop', () => {
      render(<Accordion items={mockItems} defaultOpenIndex={1} />);
      const secondButton = screen.getByText('Second Item').closest('button');
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('toggle behavior', () => {
    it('opens item when clicked', () => {
      render(<Accordion items={mockItems} />);
      const secondButton = screen.getByText('Second Item').closest('button')!;

      expect(secondButton).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(secondButton);
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes currently open item when another is clicked', () => {
      render(<Accordion items={mockItems} />);
      const firstButton = screen.getByText('First Item').closest('button')!;
      const secondButton = screen.getByText('Second Item').closest('button')!;

      // First is open by default
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Click second
      fireEvent.click(secondButton);

      // First should close, second should open
      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes item when clicking it again', () => {
      render(<Accordion items={mockItems} />);
      const firstButton = screen.getByText('First Item').closest('button')!;

      // First is open by default
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      fireEvent.click(firstButton);
      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('only allows one item open at a time', () => {
      // Start with no item open
      render(<Accordion items={mockItems} defaultOpenIndex={-1} />);
      const buttons = mockItems.map(
        (item) => screen.getByText(item.title).closest('button')!,
      );

      // Verify all start closed
      buttons.forEach((b) => {
        expect(b).toHaveAttribute('aria-expanded', 'false');
      });

      // Click first button - should open
      fireEvent.click(buttons[0]);
      expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
      expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');

      // Click second button - first should close, second should open
      fireEvent.click(buttons[1]);
      expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
      expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');

      // Click third button - second should close, third should open
      fireEvent.click(buttons[2]);
      expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
      expect(buttons[2]).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('accessibility', () => {
    it('buttons have correct aria-controls', () => {
      render(<Accordion items={mockItems} />);
      const firstButton = screen.getByText('First Item').closest('button');
      expect(firstButton).toHaveAttribute('aria-controls', 'accordion-panel-1');
    });

    it('panels have correct aria-labelledby', () => {
      render(<Accordion items={mockItems} />);
      const panel = document.getElementById('accordion-panel-1');
      expect(panel).toHaveAttribute('aria-labelledby', 'accordion-button-1');
    });

    it('panels have role="region"', () => {
      render(<Accordion items={mockItems} />);
      const panels = screen.getAllByRole('region');
      expect(panels).toHaveLength(3);
    });

    it('buttons have unique ids', () => {
      render(<Accordion items={mockItems} />);
      const ids = mockItems.map((item) =>
        document.getElementById(`accordion-button-${item.id}`),
      );
      expect(ids.every((id) => id !== null)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty items array', () => {
      render(<Accordion items={[]} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles single item', () => {
      render(<Accordion items={[mockItems[0]]} />);
      expect(screen.getByText('First Item')).toBeInTheDocument();
    });

    it('handles content with React nodes', () => {
      const itemsWithNode = [
        {
          id: '1',
          title: 'With Node',
          content: <span data-testid="react-node">React content</span>,
        },
      ];
      render(<Accordion items={itemsWithNode} />);
      expect(screen.getByTestId('react-node')).toBeInTheDocument();
    });
  });
});
