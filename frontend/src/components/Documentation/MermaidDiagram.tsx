import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

interface MermaidDiagramProps {
  chart: string;
  darkMode?: boolean;
}

let diagramCounter = 0;

export default function MermaidDiagram({ chart, darkMode = false }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
    });
  }, [darkMode]);

  useEffect(() => {
    if (!containerRef.current || !chart.trim()) return;

    const id = `mermaid-${++diagramCounter}`;
    setError(null);
    setRendered(false);

    mermaid.render(id, chart).then(({ svg }) => {
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        setRendered(true);
      }
    }).catch((err) => {
      setError(`Diagram rendering error: ${err.message ?? err}`);
    });
  }, [chart, darkMode]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">Failed to render diagram</p>
        <p className="text-xs text-red-500 dark:text-red-500 mb-3">{error}</p>
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400">
            View source
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto text-gray-700 dark:text-gray-300">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {!rendered && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <svg className="h-5 w-5 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Rendering diagram...
        </div>
      )}
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
