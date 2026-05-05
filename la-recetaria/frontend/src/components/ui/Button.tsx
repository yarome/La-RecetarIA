import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'ghost-light' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-sm gap-1.5',
  md: 'px-6 py-2.5 text-base gap-2',
  lg: 'px-8 py-3 text-lg gap-2',
};

const variantClasses: Record<Variant, string> = {
  primary:
    'border border-ink-black bg-ink-black text-canvas-white hover:bg-canvas-white hover:text-ink-black',
  ghost:
    'border border-ink-black bg-transparent text-ink-black hover:bg-ink-black hover:text-canvas-white',
  'ghost-light':
    'border border-canvas-white bg-transparent text-canvas-white hover:bg-canvas-white hover:text-ink-black',
  subtle:
    'border border-transparent bg-black/5 text-ink-black hover:bg-black/10',
  danger:
    'border border-red-600 bg-transparent text-red-600 hover:bg-red-600 hover:text-canvas-white',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    children,
    variant = 'ghost',
    size = 'md',
    iconLeft,
    iconRight,
    className = '',
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full transition-colors duration-150 disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {iconLeft}
      {children ? <span>{children}</span> : null}
      {iconRight}
    </button>
  );
});
