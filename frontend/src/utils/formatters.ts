export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function docTypeLabel(type: string): string {
  const map: Record<string, string> = {
    readme:    'README',
    api:       'API Reference',
    functions: 'Functions',
    classes:   'Classes',
    inline:    'Inline Comments',
    uml:       'UML Diagram',
    full:      'Full Docs',
  };
  return map[type] ?? type;
}

export function docTypeColor(type: string): string {
  const map: Record<string, string> = {
    readme:    'bg-strawberry-200 text-chocolate-700 dark:bg-strawberry-700/40 dark:text-strawberry-200',
    api:       'bg-mint-300 text-chocolate-700 dark:bg-mint-600/40 dark:text-mint-200',
    functions: 'bg-caramel-200 text-chocolate-700 dark:bg-caramel-800/40 dark:text-caramel-200',
    classes:   'bg-cream-300 text-chocolate-700 dark:bg-chocolate-700/60 dark:text-cream-200',
    inline:    'bg-caramel-100 text-chocolate-600 dark:bg-caramel-900/40 dark:text-caramel-300',
    uml:       'bg-strawberry-100 text-chocolate-700 dark:bg-strawberry-900/40 dark:text-strawberry-300',
    full:      'bg-caramel-500 text-white dark:bg-caramel-600 dark:text-white',
  };
  return map[type] ?? 'bg-cream-200 text-chocolate-600 dark:bg-chocolate-700 dark:text-cream-300';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending:    'text-caramel-600 dark:text-caramel-400',
    processing: 'text-caramel-700 dark:text-caramel-300',
    completed:  'text-mint-600 dark:text-mint-400',
    failed:     'text-strawberry-600 dark:text-strawberry-400',
  };
  return map[status] ?? 'text-chocolate-500';
}

export function languageIcon(lang: string): string {
  const map: Record<string, string> = {
    python: '🐍', javascript: '🟨', typescript: '🔷', java: '☕',
    go: '🐹', rust: '🦀', cpp: '⚙️', c: '⚙️', csharp: '🎯',
    php: '🐘', ruby: '💎', swift: '🐦', kotlin: '🎯', scala: '🔴',
    html: '🌐', css: '🎨', sql: '🗄️', markdown: '📝',
  };
  return map[lang] ?? '📄';
}
