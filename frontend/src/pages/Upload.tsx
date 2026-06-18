import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/Upload/FileUploader';
import ZipUploader from '../components/Upload/ZipUploader';
import GithubImporter from '../components/Upload/GithubImporter';
import { useApp } from '../hooks/useApp';

type Tab = 'file' | 'zip' | 'github';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'file',   label: 'Single File',  icon: '📄' },
  { id: 'zip',    label: 'ZIP Archive',  icon: '🗜️' },
  { id: 'github', label: 'GitHub Repo',  icon: '🐙' },
];

const features = [
  'README.md with installation and usage instructions',
  'REST API reference documentation',
  'Function and class documentation',
  'UML class diagrams (Mermaid.js)',
  'Inline commented source code',
  'PDF and DOCX export',
];

export default function Upload() {
  const [activeTab, setActiveTab] = useState<Tab>('file');
  const { addToast } = useApp();
  const navigate = useNavigate();

  const handleSuccess = (result: { project_id: string; name: string }) => {
    addToast('success', `"${result.name}" uploaded successfully`);
    navigate(`/documentation?project=${result.project_id}`);
  };

  const handleError = (msg: string) => addToast('error', msg);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold text-chocolate-700 dark:text-cream-100">Add a Project</h2>
        <p className="text-sm text-chocolate-500 dark:text-cream-400 mt-1">
          Upload source code to generate technical documentation automatically.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 p-1.5 bg-cream-200 dark:bg-chocolate-800 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-caramel-500 text-white shadow-md scale-[1.02]'
                : 'text-chocolate-500 dark:text-cream-400 hover:text-chocolate-700 dark:hover:text-cream-200 hover:bg-cream-100 dark:hover:bg-chocolate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="bg-cream-50 dark:bg-chocolate-900 rounded-2xl border border-cream-300 dark:border-chocolate-700 p-6 shadow-sm animate-scale-in">
        {activeTab === 'file'   && <FileUploader  onSuccess={handleSuccess} onError={handleError} />}
        {activeTab === 'zip'    && <ZipUploader   onSuccess={handleSuccess} onError={handleError} />}
        {activeTab === 'github' && <GithubImporter onSuccess={handleSuccess} onError={handleError} />}
      </div>

      {/* What you'll get */}
      <div className="p-5 bg-caramel-50 dark:bg-caramel-950/20 border border-caramel-200 dark:border-caramel-800 rounded-2xl">
        <p className="text-xs font-semibold text-caramel-700 dark:text-caramel-300 uppercase tracking-widest mb-3">
          What gets generated
        </p>
        <ul className="space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-chocolate-600 dark:text-cream-400">
              <span className="w-4 h-4 rounded-full bg-caramel-400 text-white flex items-center justify-center text-xs flex-shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
