import { useState } from 'react';
import Button from '../Common/Button';
import { importGitHub } from '../../services/api';
import type { GitHubImportResponse } from '../../types';

interface GithubImporterProps {
  onSuccess: (result: GitHubImportResponse) => void;
  onError: (msg: string) => void;
}

export default function GithubImporter({ onSuccess, onError }: GithubImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(url.trim());

  const handleImport = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await importGitHub(url.trim());
      onSuccess(result);
      setUrl('');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-5 bg-cream-200 dark:bg-chocolate-800/50 rounded-2xl border border-cream-300 dark:border-chocolate-700">
        <span className="text-4xl animate-float">🐙</span>
        <div>
          <p className="font-semibold text-chocolate-700 dark:text-cream-200 text-sm">Import from GitHub</p>
          <p className="text-xs text-chocolate-500 dark:text-cream-400 mt-0.5">
            Public repos work immediately. Private repos require a <code className="font-mono bg-cream-300 dark:bg-chocolate-700 px-1 rounded">GITHUB_TOKEN</code> in .env
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-chocolate-600 dark:text-cream-300 mb-1.5">
          Repository URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && isValid) handleImport(); }}
          placeholder="https://github.com/owner/repository"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-cream-50 dark:bg-chocolate-900 text-chocolate-800 dark:text-cream-100 placeholder-chocolate-300 dark:placeholder-chocolate-600 focus:outline-none focus:ring-2 focus:ring-caramel-400 transition-all ${
            url && !isValid
              ? 'border-strawberry-500 dark:border-strawberry-600'
              : 'border-cream-400 dark:border-chocolate-600'
          }`}
        />
        {url && !isValid && (
          <p className="text-xs text-strawberry-600 dark:text-strawberry-400 mt-1.5 animate-slide-in">
            Enter a valid GitHub repository URL
          </p>
        )}
      </div>

      <div className="text-xs text-chocolate-400 dark:text-cream-500 bg-cream-200 dark:bg-chocolate-800/30 rounded-xl p-3 space-y-1">
        <p className="font-medium text-chocolate-500 dark:text-cream-400">Supported formats:</p>
        <p className="font-mono">https://github.com/owner/repo</p>
        <p className="font-mono">https://github.com/owner/repo.git</p>
      </div>

      <Button onClick={handleImport} disabled={!isValid} loading={loading} className="w-full justify-center">
        {loading ? 'Cloning repository…' : 'Import Repository'}
      </Button>
    </div>
  );
}
