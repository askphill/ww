import {Link} from 'react-router';

interface ButtonProps {
  children: React.ReactNode;
  to?: string;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
}

export function Button({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  onClick,
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center px-8 pt-3.5 pb-4 h-11 font-display text-base rounded-full transition-colors md:h-14';

  const variants = {
    primary: 'bg-black text-sand hover:bg-black/90',
    secondary: 'bg-sand text-black hover:bg-sand/90',
    outline: 'bg-transparent text-text border border-black hover:bg-black/5',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClassName}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={combinedClassName}>
      {children}
    </button>
  );
}
