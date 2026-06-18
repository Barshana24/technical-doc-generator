import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useApp } from '../../hooks/useApp';
import MermaidDiagram from './MermaidDiagram';
import Badge from '../Common/Badge';
import type { GeneratedDocument } from '../../types';
import { docTypeLabel, docTypeColor, formatDate } from '../../utils/formatters';

interface DocViewerProps {
  document: GeneratedDocument;
}

export default function DocViewer({ document: doc }: DocViewerProps) {
  const { darkMode } = useApp();

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-cream-300 dark:border-chocolate-700">
        <Badge label={docTypeLabel(doc.doc_type)} className={docTypeColor(doc.doc_type)} />
        <span className="text-xs text-chocolate-400 dark:text-cream-500">
          Generated {formatDate(doc.created_at)}
        </span>
      </div>

      {doc.mermaid_diagram && (
        <div className="mb-4 animate-scale-in">
          <h3 className="text-xs font-semibold text-chocolate-500 dark:text-caramel-400 uppercase tracking-widest mb-3">
            Class Diagram
          </h3>
          <MermaidDiagram chart={doc.mermaid_diagram} darkMode={darkMode} />
        </div>
      )}

      <div className="prose prose-sm max-w-none
        prose-headings:text-chocolate-700 dark:prose-headings:text-cream-100
        prose-p:text-chocolate-600 dark:prose-p:text-cream-300
        prose-strong:text-chocolate-700 dark:prose-strong:text-cream-100
        prose-a:text-caramel-600 dark:prose-a:text-caramel-400
        prose-code:text-chocolate-700 dark:prose-code:text-cream-200
        prose-pre:bg-chocolate-900 dark:prose-pre:bg-chocolate-950
        prose-th:bg-cream-200 dark:prose-th:bg-chocolate-800
        prose-tr:border-cream-300 dark:prose-tr:border-chocolate-700
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const isBlock = Boolean(match);
              return isBlock ? (
                <SyntaxHighlighter
                  style={darkMode ? oneDark : oneLight}
                  language={match![1]}
                  PreTag="div"
                  className="rounded-xl text-xs"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code
                  className="bg-cream-200 dark:bg-chocolate-800 px-1.5 py-0.5 rounded-md text-xs font-mono text-chocolate-700 dark:text-cream-200"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto rounded-xl border border-cream-300 dark:border-chocolate-700">
                  <table className="min-w-full">{children}</table>
                </div>
              );
            },
          }}
        >
          {doc.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
