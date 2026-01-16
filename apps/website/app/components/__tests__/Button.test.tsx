import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Button} from '@wakey/ui';
import {MemoryRouter} from 'react-router';

describe('Button', () => {
  describe('as button element', () => {
    it('renders with primary variant by default', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', {name: 'Click me'});
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-black', 'text-sand');
    });

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button', {name: 'Secondary'});
      expect(button).toHaveClass('bg-sand', 'text-black');
    });

    it('renders with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button', {name: 'Outline'});
      expect(button).toHaveClass('bg-transparent', 'border');
    });

    it('handles click events', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);
      const button = screen.getByRole('button', {name: 'Clickable'});
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders with disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', {name: 'Disabled'});
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('renders with icon', () => {
      render(
        <Button icon={<span data-testid="test-icon">★</span>}>
          With Icon
        </Button>,
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(
        screen.getByRole('button', {name: /With Icon/}),
      ).toBeInTheDocument();
    });
  });

  describe('as anchor element', () => {
    it('renders as anchor when href is provided', () => {
      render(<Button href="https://example.com">External Link</Button>);
      const link = screen.getByRole('link', {name: 'External Link'});
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('as Link component', () => {
    it('renders as Link when to prop is provided', () => {
      render(
        <MemoryRouter>
          <Button to="/products">Internal Link</Button>
        </MemoryRouter>,
      );
      const link = screen.getByRole('link', {name: 'Internal Link'});
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/products');
    });
  });
});
