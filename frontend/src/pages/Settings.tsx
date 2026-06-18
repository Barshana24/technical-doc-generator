import React, { useEffect, useState } from 'react';
import { fetchHealth } from '../services/api';
import { useApp } from '../hooks/useApp';
import type { HealthResponse } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useApp();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    fetchHealth().then(setHealth).catch(() => setHealth(null)).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-up">
      {/* Appearance */}
      <Section title="Appearance">
        <SettingRow
          label="Dark Mode"
          description="Switch to the chocolate dark theme"
          action={<Toggle enabled={darkMode} onChange={toggleDarkMode} />}
        />
      </Section>

      {/* AI */}
      <Section title="AI Configuration">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-chocolate-700 dark:text-cream-200">Ollama Status</p>
              <p className="text-xs text-chocolate-400 dark:text-cream-500">Local AI model server</p>
            </div>
            <div className="flex items-center gap-2">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span className={`flex items-center gap-1.5 text-sm font-semibold ${
                  health?.ollama.connected
                    ? 'text-mint-600 dark:text-mint-400'
                    : 'text-strawberry-600 dark:text-strawberry-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${health?.ollama.connected ? 'bg-mint-500 animate-pulse-soft' : 'bg-strawberry-500'}`} />
                  {health?.ollama.connected ? 'Connected' : 'Disconnected'}
                </span>
              )}
              <button onClick={reload} className="text-xs text-caramel-600 dark:text-caramel-400 hover:underline">
                Refresh
              </button>
            </div>
          </div>

          {health?.ollama.connected && health.ollama.models.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-chocolate-500 dark:text-cream-400 uppercase tracking-widest mb-2">Available Models</p>
              <div className="space-y-1.5">
                {health.ollama.models.map((model, i) => (
                  <div
                    key={model}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-mint-100 dark:bg-mint-600/10 border border-mint-300 dark:border-mint-700 animate-fade-up"
                  >
                    <span className="w-2 h-2 rounded-full bg-mint-500 animate-pulse-soft flex-shrink-0" />
                    <span className="text-sm font-mono text-chocolate-700 dark:text-cream-200">{model}</span>
                    {i === 0 && (
                      <span className="ml-auto text-xs bg-caramel-500 text-white px-2 py-0.5 rounded-full">active</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!health?.ollama.connected && !loading && (
            <div className="p-4 bg-strawberry-100 dark:bg-strawberry-900/20 border border-strawberry-300 dark:border-strawberry-700 rounded-xl animate-slide-in">
              <p className="text-sm font-semibold text-chocolate-700 dark:text-strawberry-300 mb-2">Ollama not detected</p>
              <ol className="text-xs text-chocolate-500 dark:text-strawberry-400 space-y-1 ml-4 list-decimal">
                <li>Install Ollama from <span className="font-mono">ollama.ai</span></li>
                <li>Run: <code className="bg-strawberry-200 dark:bg-strawberry-900 px-1 rounded font-mono">ollama serve</code></li>
                <li>Pull: <code className="bg-strawberry-200 dark:bg-strawberry-900 px-1 rounded font-mono">ollama pull qwen2.5-coder:7b</code></li>
              </ol>
            </div>
          )}
        </div>
      </Section>

      {/* Environment */}
      <Section title="Environment Variables">
        <div className="space-y-2">
          {[
            { k: 'OLLAMA_BASE_URL', v: 'http://localhost:11434' },
            { k: 'OLLAMA_MODEL',    v: 'qwen2.5-coder:7b' },
            { k: 'MAX_FILE_SIZE',   v: '50 MB' },
            { k: 'GITHUB_TOKEN',    v: '(optional)', masked: true },
          ].map(({ k, v, masked }) => (
            <div key={k} className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl bg-cream-200 dark:bg-chocolate-800">
              <code className="text-xs font-mono text-chocolate-600 dark:text-cream-300">{k}</code>
              <span className={`text-xs ${masked ? 'italic text-chocolate-300 dark:text-cream-600' : 'font-mono text-chocolate-700 dark:text-cream-200'}`}>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-chocolate-400 dark:text-cream-500 mt-3">
          Configure in <code className="font-mono text-xs bg-cream-200 dark:bg-chocolate-700 px-1 rounded">backend/.env</code>
        </p>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-caramel-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            TD
          </div>
          <div>
            <p className="font-semibold text-chocolate-700 dark:text-cream-100">Technical Documentation Generator</p>
            <p className="text-xs text-chocolate-400 dark:text-cream-500 mt-0.5">FastAPI · React · SQLite · Ollama</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['FastAPI', 'React 18', 'Tailwind CSS', 'SQLite', 'Ollama', 'Qwen Coder'].map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full bg-caramel-100 dark:bg-caramel-950/40 text-caramel-700 dark:text-caramel-300 text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-cream-50 dark:bg-chocolate-900 rounded-2xl border border-cream-300 dark:border-chocolate-700 overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-cream-300 dark:border-chocolate-700 bg-cream-100 dark:bg-chocolate-800/50">
        <h2 className="text-xs font-semibold text-chocolate-500 dark:text-cream-400 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, action }: { label: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-chocolate-700 dark:text-cream-200">{label}</p>
        <p className="text-xs text-chocolate-400 dark:text-cream-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-caramel-400 focus:ring-offset-2 dark:focus:ring-offset-chocolate-900 ${
        enabled ? 'bg-caramel-500' : 'bg-cream-400 dark:bg-chocolate-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}
