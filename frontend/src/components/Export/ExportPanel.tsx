import Button from '../Common/Button';
import type { Project } from '../../types';
import { getProjectPdfUrl, getProjectDocxUrl } from '../../services/api';

interface ExportPanelProps {
  project: Project;
  documentCount: number;
}

export default function ExportPanel({ project, documentCount }: ExportPanelProps) {
  if (documentCount === 0) {
    return (
      <p className="text-xs text-chocolate-400 dark:text-cream-500 italic">
        Generate docs first to export
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={getProjectPdfUrl(project.id)} download>
        <Button variant="secondary" size="sm" icon={<span>📥</span>}>
          Export PDF
        </Button>
      </a>
      <a href={getProjectDocxUrl(project.id)} download>
        <Button variant="secondary" size="sm" icon={<span>📝</span>}>
          Export DOCX
        </Button>
      </a>
    </div>
  );
}
