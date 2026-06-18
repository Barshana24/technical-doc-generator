import { useState } from 'react';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import type { GeneratedDocument } from '../../types';
import { docTypeLabel, docTypeColor, formatDate } from '../../utils/formatters';
import { getDocPdfUrl, getDocDocxUrl } from '../../services/api';

interface DocCardProps {
  doc: GeneratedDocument;
  onView: (doc: GeneratedDocument) => void;
  onDelete: (docId: string) => void;
}

export default function DocCard({ doc, onView, onDelete }: DocCardProps) {
  const [hovered, setHovered] = useState(false);
  const preview = doc.content.replace(/#{1,6}\s/g, '').replace(/\*+/g, '').trim().slice(0, 130);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-cream-50 dark:bg-chocolate-900 rounded-2xl border transition-all duration-200 p-5 ${
        hovered
          ? 'border-caramel-400 dark:border-caramel-600 shadow-md -translate-y-0.5'
          : 'border-cream-300 dark:border-chocolate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-chocolate-700 dark:text-cream-100 text-sm truncate">{doc.title}</h3>
          <p className="text-xs text-chocolate-400 dark:text-cream-500 mt-0.5">{formatDate(doc.created_at)}</p>
        </div>
        <Badge label={docTypeLabel(doc.doc_type)} className={docTypeColor(doc.doc_type)} />
      </div>

      <p className="text-xs text-chocolate-500 dark:text-cream-400 line-clamp-2 mb-4 leading-relaxed">
        {preview}…
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={() => onView(doc)}>
          View
        </Button>
        <a href={getDocPdfUrl(doc.id)} download>
          <Button size="sm" variant="secondary">PDF</Button>
        </a>
        <a href={getDocDocxUrl(doc.id)} download>
          <Button size="sm" variant="secondary">DOCX</Button>
        </a>
        <Button
          size="sm"
          variant="danger"
          className="ml-auto"
          onClick={() => { if (confirm('Delete this document?')) onDelete(doc.id); }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
