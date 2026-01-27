import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {Button} from '../Button';

// Wrapper for components that use react-router Link
const RouterWrapper = ({children}: {children: React.ReactNode}) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Button', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('renders as a button by default', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders as a Link when "to" prop is provided', () => {
      render(
        <RouterWrapper>
          <Button to="/cart">Go to cart</Button>
        </RouterWrapper>,
      );
      expect(screen.getByRole('link')).toHaveAttribute('href', '/cart');
    });

    it('renders as an anchor when "href" prop is provided', () => {
      render(<Button href="https://example.com">External link</Button>);
      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        'https://example.com',
      );
    });

    it('renders icon when provided', () => {
      render(
        <Button icon={<span data-testid="icon">★</span>}>With icon</Button>,
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-black', 'text-sand');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-sand', 'text-black');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'border');
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('opacity-50');
    });
  });

  describe('accessibility', () => {
    it('applies aria-label when provided', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Close dialog',
      );
    });

    it('respects tabIndex prop', () => {
      render(<Button tabIndex={-1}>Not focusable</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('form behavior', () => {
    it('has type="button" by default', () => {
      render(<Button>Default type</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('can be type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });
});
