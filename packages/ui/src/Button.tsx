import {Link} from 'react-router';

interface ButtonProps {
  children: React.ReactNode;
  to?: string;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  icon?: React.ReactNode;
  'aria-label'?: string;
  prefetch?: 'intent' | 'render' | 'none' | 'viewport';
}

export function Button({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  icon,
  'aria-label': ariaLabel,
  prefetch,
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 px-6 h-14 font-display text-label rounded-full transition-colors cursor-pointer';

  const variants = {
    primary: 'bg-black text-sand hover:bg-black/90',
    secondary: 'bg-sand text-black hover:bg-sand/90',
    outline: 'bg-transparent text-text border border-black hover:bg-black/5',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const combinedClassName = `${baseStyles} ${variants[variant]} ${disabledStyles} ${className}`;

  const content = (
    <>
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClassName} onClick={onClick} aria-label={ariaLabel} prefetch={prefetch}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClassName} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
