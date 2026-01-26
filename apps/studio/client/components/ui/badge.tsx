import * as React from 'react';
import {cn} from '../../lib/utils';

const badgeVariants = {
  base: 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
  variant: {
    default: 'bg-muted text-muted-foreground',
    red: 'badge-red',
    amber: 'badge-amber',
    blue: 'badge-blue',
    green: 'badge-green',
    orange: 'badge-orange',
    // Chart color variants
    'chart-2': 'bg-chart-2/20 text-chart-2',
    'chart-3': 'bg-chart-3/20 text-chart-3',
    'chart-4': 'bg-chart-4/20 text-chart-4',
    // Position-specific variants
    'position-top': 'bg-green-500/20 text-green-600 dark:text-green-400',
    'position-good': 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    'position-moderate': 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants.variant;
}

function Badge({className, variant = 'default', ...props}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants.base,
        badgeVariants.variant[variant],
        className,
      )}
      {...props}
    />
  );
}

export {Badge, badgeVariants};
