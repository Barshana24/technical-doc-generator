import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects, useDocuments, useJobPoller } from '../hooks/useDocumentation';
import { generateDocumentation } from '../services/api';
import { useApp } from '../hooks/useApp';
import Button from '../components/Common/Button';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import DocCard from '../components/Documentation/DocCard';
import DocViewer from '../components/Documentation/DocViewer';
import ExportPanel from '../components/Export/ExportPanel';
import type { GeneratedDocument, Project } from '../types';
import { languageIcon, statusColor } from '../utils/formatters';

const DOC_TYPE_OPTIONS = [
  { id: 'readme',    label: 'README',      desc: 'Project overview and setup guide' },
  { id: 'api',       label: 'API Ref',     desc: 'Endpoint documentation' },
  { id: 'functions', label: 'Functions',   desc: 'All function signatures and docs' },
  { id: 'classes',   label: 'Classes',     desc: 'OOP class documentation' },
  { id: 'uml',       label: 'UML',         desc: 'Mermaid class diagram' },
  { id: 'inline',    label: 'Comments',    desc: 'Commented source code' },
];

export default function Documentation() {
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('project');

  const { projects, loading: projectsLoading, load: loadProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { documents, loading: docsLoading, load: loadDocs, remove: removeDoc } = useDocuments(selectedProject?.id ?? null);

  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>(['full']);
  const [generating, setGenerating] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<GeneratedDocument | null>(null);

  const { addToast } = useApp();
  const { job, poll: pollJob } = useJobPoller();

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (projects.length > 0) {
      const target = preselectedProjectId
        ? projects.find((p) => p.id === preselectedProjectId)
        : projects[0];
      if (target) setSelectedProject(target);
    }
  }, [projects, preselectedProjectId]);

  useEffect(() => { if (selectedProject) loadDocs(); }, [selectedProject, loadDocs]);

  const toggleDocType = (type: string) => {
    if (type === 'full') { setSelectedDocTypes(['full']); return; }
    setSelectedDocTypes((prev) => {
      const without = prev.filter((t) => t !== 'full');
      return prev.includes(type) ? without.filter((t) => t !== type) : [...without, type];
    });
  };

  const handleGenerate = async () => {
    if (!selectedProject) return;
    setGenerating(true);
    try {
      const jobResult = await generateDocumentation(selectedProject.id, selectedDocTypes);
      addToast('info', 'Generation started — this may take a few minutes');
      pollJob(
        jobResult.job_id,
        (j) => {
          if (j.document_count === 0) {
            addToast('warning', 'Generation finished but no documents were produced. Try "Full Documentation" or upload a code file with functions and classes.');
          } else {
            addToast('success', `Documentation ready — ${j.document_count} document${j.document_count !== 1 ? 's' : ''} generated`);
          }
          setGenerating(false);
          loadDocs();
        },
        (msg) => { addToast('error', `Failed: ${msg}`); setGenerating(false); }
      );
    } catch (err) {
      addToast('error', (err as Error).message);
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project list */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-chocolate-500 dark:text-cream-400 uppercase tracking-widest">Projects</h2>
          {projectsLoading ? (
            <LoadingSpinner size="sm" />
          ) : projects.length === 0 ? (
            <p className="text-xs text-chocolate-400 dark:text-cream-500">No projects. Upload some code first.</p>
          ) : (
            <div className="space-y-1.5">
              {projects.map((p, i) => (
                <button
                  key={p.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => setSelectedProject(p)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all duration-200 animate-fade-up ${
                    selectedProject?.id === p.id
                      ? 'border-caramel-400 bg-caramel-50 dark:bg-caramel-950/30 text-chocolate-700 dark:text-cream-100 shadow-sm'
                      : 'border-cream-300 dark:border-chocolate-700 bg-cream-50 dark:bg-chocolate-900 text-chocolate-600 dark:text-cream-300 hover:border-caramel-300 dark:hover:border-caramel-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{p.source_type === 'github' ? '🐙' : p.source_type === 'zip' ? '🗜️' : '📄'}</span>
                    <span className="font-medium truncate">{p.name}</span>
                  </div>
                  {p.language_stats && (
                    <div className="flex gap-0.5 mt-1.5 ml-6">
                      {Object.keys(p.language_stats).slice(0, 4).map((lang) => (
                        <span key={lang} className="text-xs" title={lang}>{languageIcon(lang)}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3 space-y-5 animate-fade-up">
          {selectedProject ? (
            <>
              {/* Project header */}
              <div className="bg-cream-50 dark:bg-chocolate-900 rounded-2xl border border-cream-300 dark:border-chocolate-700 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-semibold text-chocolate-700 dark:text-cream-100 text-lg">{selectedProject.name}</h2>
                    <div className="flex gap-3 mt-1">
                      {selectedProject.file_count !== undefined && (
                        <span className="text-xs text-chocolate-400 dark:text-cream-500">{selectedProject.file_count} files</span>
                      )}
                      {selectedProject.github_url && (
                        <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-caramel-600 dark:text-caramel-400 hover:underline">
                          View on GitHub →
                        </a>
                      )}
                    </div>
                  </div>
                  <ExportPanel project={selectedProject} documentCount={documents.length} />
                </div>
              </div>

              {/* Generate panel */}
              <div className="bg-cream-50 dark:bg-chocolate-900 rounded-2xl border border-cream-300 dark:border-chocolate-700 p-5 shadow-sm">
                <h3 className="font-semibold text-chocolate-700 dark:text-cream-100 text-sm mb-4">Generate Documentation</h3>

                {generating && job && (
                  <div className={`mb-4 flex items-center gap-2.5 text-sm ${statusColor(job.status)} animate-slide-in`}>
                    <LoadingSpinner size="sm" />
                    <span>
                      {job.status === 'processing' ? 'AI is generating documentation…' : `Status: ${job.status}`}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <TypeButton active={selectedDocTypes.includes('full')} label="Full Documentation" onClick={() => setSelectedDocTypes(['full'])} />
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <TypeButton
                      key={opt.id}
                      active={selectedDocTypes.includes(opt.id) && !selectedDocTypes.includes('full')}
                      label={opt.label}
                      title={opt.desc}
                      onClick={() => toggleDocType(opt.id)}
                    />
                  ))}
                </div>

                <Button onClick={handleGenerate} loading={generating} disabled={selectedDocTypes.length === 0}>
                  {generating ? 'Generating…' : 'Generate'}
                </Button>
              </div>

              {/* Documents grid */}
              <div>
                <h3 className="text-xs font-semibold text-chocolate-500 dark:text-cream-400 uppercase tracking-widest mb-4">
                  Generated Documents ({documents.length})
                </h3>
                {docsLoading ? (
                  <div className="py-10 flex justify-center"><LoadingSpinner size="md" label="Loading documents…" /></div>
                ) : documents.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-cream-300 dark:border-chocolate-700 rounded-2xl">
                    <p className="text-3xl mb-2 animate-float">📭</p>
                    <p className="text-sm text-chocolate-400 dark:text-cream-500">No documents yet. Click Generate above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc, i) => (
                      <div key={doc.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-up">
                        <DocCard
                          doc={doc}
                          onView={setViewingDoc}
                          onDelete={(id) => removeDoc(id).then(() => addToast('success', 'Document deleted'))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-24 text-center animate-fade-in">
              <p className="text-5xl mb-4 animate-float">👈</p>
              <p className="text-chocolate-400 dark:text-cream-500 text-sm">Select a project from the left</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!viewingDoc} onClose={() => setViewingDoc(null)} title={viewingDoc?.title ?? ''} width="max-w-4xl">
        {viewingDoc && <DocViewer document={viewingDoc} />}
      </Modal>
    </div>
  );
}

function TypeButton({ active, label, onClick, title }: { active: boolean; label: string; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 ${
        active
          ? 'bg-caramel-500 text-white border-caramel-500 shadow-sm'
          : 'bg-cream-100 dark:bg-chocolate-800 text-chocolate-600 dark:text-cream-400 border-cream-400 dark:border-chocolate-600 hover:border-caramel-400 dark:hover:border-caramel-600'
      }`}
    >
      {label}
    </button>
  );
}
