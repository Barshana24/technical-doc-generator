import { useApp } from '../../hooks/useApp';

interface HeaderProps {
  title: string;
  onMenuOpen: () => void;
}

export default function Header({ title, onMenuOpen }: HeaderProps) {
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 sm:px-6 bg-cream-50 dark:bg-chocolate-900 border-b border-cream-300 dark:border-chocolate-800 shadow-sm">
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg text-chocolate-500 hover:bg-cream-200 dark:hover:bg-chocolate-800"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="flex-1 font-semibold text-chocolate-700 dark:text-cream-100 text-lg tracking-wide">
        {title}
      </h1>

      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-xl text-chocolate-500 dark:text-caramel-300 hover:bg-cream-200 dark:hover:bg-chocolate-800 transition-colors"
        aria-label="Toggle dark mode"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
    </header>
  );
}
