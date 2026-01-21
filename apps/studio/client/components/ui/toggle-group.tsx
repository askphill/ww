import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import {cn} from '../../lib/utils';

const ToggleGroupContext = React.createContext<{
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline';
}>({
  size: 'default',
  variant: 'default',
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
    variant?: 'default' | 'outline';
    size?: 'default' | 'sm' | 'lg';
  }
>(
  (
    {className, variant = 'default', size = 'default', children, ...props},
    ref,
  ) => (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{variant, size}}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  ),
);

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const toggleVariants = {
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
  variant: {
    default: 'bg-transparent',
    outline:
      'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
  },
  size: {
    default: 'h-9 px-3 min-w-9',
    sm: 'h-8 px-2 min-w-8',
    lg: 'h-10 px-3 min-w-10',
  },
};

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
    variant?: 'default' | 'outline';
    size?: 'default' | 'sm' | 'lg';
  }
>(({className, children, variant, size, ...props}, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants.base,
        toggleVariants.variant[variant || context.variant || 'default'],
        toggleVariants.size[size || context.size || 'default'],
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export {ToggleGroup, ToggleGroupItem};
