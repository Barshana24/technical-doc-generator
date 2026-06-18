import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useDocumentation';
import { fetchDocuments } from '../services/api';
import { useApp } from '../hooks/useApp';
import Button from '../components/Common/Button';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Badge from '../components/Common/Badge';
import { formatDate, languageIcon } from '../utils/formatters';
import { getProjectPdfUrl, getProjectDocxUrl } from '../services/api';

export default function History() {
  const { projects, loading, load: loadProjects, remove: removeProject } = useProjects();
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const { addToast } = useApp();

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) return;
    Promise.all(
      projects.map(async (p) => {
        try { const docs = await fetchDocuments(p.id); return { id: p.id, count: docs.length }; }
        catch { return { id: p.id, count: 0 }; }
      })
    ).then((results) => {
      const map: Record<string, number> = {};
      results.forEach(({ id, count }) => { map[id] = count; });
      setDocCounts(map);
    });
  }, [projects]);

  const handleDelete = async (projectId: string, name: string) => {
    if (!confirm(`Delete project "${name}" and all its documentation?`)) return;
    try { await removeProject(projectId); addToast('success', `"${name}" deleted`); }
    catch (err) { addToast('error', (err as Error).message); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-chocolate-700 dark:text-cream-100 text-lg">Documentation History</h2>
          <p className="text-sm text-chocolate-400 dark:text-cream-500 mt-0.5">All uploaded projects and generated documents</p>
        </div>
        <Link to="/upload">
          <Button>Add Project</Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-14 flex justify-center"><LoadingSpinner size="md" label="Loading history…" /></div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-cream-300 dark:border-chocolate-700 rounded-2xl">
          <p className="text-5xl mb-4 animate-float">📚</p>
          <p className="text-chocolate-400 dark:text-cream-500">No projects yet</p>
          <Link to="/upload" className="mt-3 inline-block text-sm text-caramel-600 dark:text-caramel-400 hover:underline font-medium">
            Upload your first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p, i) => (
            <div
              key={p.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className="bg-cream-50 dark:bg-chocolate-900 rounded-2xl border border-cream-300 dark:border-chocolate-700 p-5 hover:border-caramel-300 dark:hover:border-caramel-700 hover:shadow-md transition-all duration-200 animate-fade-up"
            >
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-11 h-11 rounded-2xl bg-caramel-100 dark:bg-caramel-950/40 flex items-center justify-center text-2xl flex-shrink-0">
                  {p.source_type === 'github' ? '🐙' : p.source_type === 'zip' ? '🗜️' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-chocolate-700 dark:text-cream-100">{p.name}</h3>
                    <Badge
                      label={p.source_type.toUpperCase()}
                      className="bg-cream-200 dark:bg-chocolate-700 text-chocolate-500 dark:text-cream-400"
                    />
                  </div>
                  <p className="text-xs text-chocolate-400 dark:text-cream-500 mt-1">{formatDate(p.created_at)}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    {p.language_stats && Object.keys(p.language_stats).length > 0 && (
                      <div className="flex gap-1 items-center">
                        {Object.keys(p.language_stats).slice(0, 5).map((lang) => (
                          <span key={lang} title={lang} className="text-base">{languageIcon(lang)}</span>
                        ))}
                        <span className="text-xs text-chocolate-400 dark:text-cream-500 ml-1">
                          {p.file_count} files
                        </span>
                      </div>
                    )}
                    {p.github_url && (
                      <a href={p.github_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-caramel-600 dark:text-caramel-400 hover:underline">
                        {p.github_url.replace('https://github.com/', '')}
                      </a>
                    )}
                    <span className="text-xs text-chocolate-400 dark:text-cream-500">
                      {docCounts[p.id] ?? '…'} documents
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <Link to={`/documentation?project=${p.id}`}>
                    <Button size="sm" variant="secondary">View Docs</Button>
                  </Link>
                  {(docCounts[p.id] ?? 0) > 0 && (
                    <>
                      <a href={getProjectPdfUrl(p.id)} download>
                        <Button size="sm" variant="secondary">PDF</Button>
                      </a>
                      <a href={getProjectDocxUrl(p.id)} download>
                        <Button size="sm" variant="secondary">DOCX</Button>
                      </a>
                    </>
                  )}
                  <Button size="sm" variant="danger" onClick={() => handleDelete(p.id, p.name)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
