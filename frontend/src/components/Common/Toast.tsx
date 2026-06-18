import { useApp } from '../../hooks/useApp';
import type { ToastMessage } from '../../types';

const icons: Record<ToastMessage['type'], string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

const styles: Record<ToastMessage['type'], string> = {
  success: 'bg-mint-200 dark:bg-mint-600/30 border-mint-400 text-chocolate-700 dark:text-mint-200',
  error:   'bg-strawberry-200 dark:bg-strawberry-700/30 border-strawberry-500 text-chocolate-700 dark:text-strawberry-200',
  info:    'bg-caramel-100 dark:bg-caramel-900/30 border-caramel-400 text-chocolate-700 dark:text-caramel-200',
  warning: 'bg-cream-200 dark:bg-chocolate-700/50 border-caramel-500 text-chocolate-700 dark:text-cream-200',
};

const iconStyles: Record<ToastMessage['type'], string> = {
  success: 'bg-mint-400 text-white',
  error:   'bg-strawberry-500 text-white',
  info:    'bg-caramel-500 text-white',
  warning: 'bg-caramel-400 text-white',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t, i) => (
        <div
          key={t.id}
          style={{ animationDelay: `${i * 50}ms` }}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg animate-slide-in ${styles[t.type]}`}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${iconStyles[t.type]}`}>
            {icons[t.type]}
          </span>
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-50 hover:opacity-100 text-lg leading-none transition-opacity"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
