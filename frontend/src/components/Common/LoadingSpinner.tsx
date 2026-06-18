interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export default function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 animate-fade-in">
      <div className="relative">
        <svg
          className={`${sizes[size]} animate-spin text-caramel-500`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        {size === 'lg' && (
          <div className="absolute inset-0 rounded-full bg-caramel-200/20 dark:bg-caramel-900/20 animate-pulse-soft" />
        )}
      </div>
      {label && <p className="text-sm text-chocolate-500 dark:text-cream-400 animate-pulse-soft">{label}</p>}
    </div>
  );
}
