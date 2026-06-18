import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-caramel-500 text-white hover:bg-caramel-600 active:scale-95 focus:ring-caramel-400 disabled:bg-caramel-300 shadow-sm hover:shadow-md',
  secondary: 'bg-cream-100 dark:bg-chocolate-800 text-chocolate-700 dark:text-cream-200 border border-cream-400 dark:border-chocolate-600 hover:bg-cream-200 dark:hover:bg-chocolate-700 active:scale-95 focus:ring-caramel-400',
  danger:    'bg-strawberry-600 text-white hover:bg-strawberry-700 active:scale-95 focus:ring-strawberry-400 disabled:bg-strawberry-300 shadow-sm',
  ghost:     'text-chocolate-600 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-chocolate-800 active:scale-95 focus:ring-caramel-300',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-chocolate-900',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}
