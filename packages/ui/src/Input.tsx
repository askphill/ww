import {forwardRef} from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'outline' | 'filled';
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({className = '', variant = 'outline', icon, ...props}, ref) => {
    const baseStyles =
      'w-full px-6 h-14 font-display text-label rounded-full transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      outline:
        'bg-transparent text-text border border-black placeholder:text-text/50 focus:border-black/70',
      filled: 'bg-black text-sand border border-black placeholder:text-sand/50',
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${icon ? 'pr-14' : ''} ${className}`;

    return (
      <div className="relative">
        <input ref={ref} className={combinedClassName} {...props} />
        {icon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
