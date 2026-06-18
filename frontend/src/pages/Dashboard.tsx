import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useDocumentation';
import { fetchHealth } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import type { HealthResponse } from '../types';
import { formatDate, languageIcon } from '../utils/formatters';

export default function Dashboard() {
  const { projects, loading, load } = useProjects();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    load();
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, [load]);

  const recentProjects = projects.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Projects',        value: loading ? '…' : String(projects.length), icon: '📁', delay: 0,   color: 'caramel' },
          { label: 'AI Status',       value: healthLoading ? '…' : (health?.ollama.connected ? 'Online' : 'Offline'), icon: '🤖', delay: 75,  color: health?.ollama.connected ? 'mint' : 'strawberry' },
          { label: 'Models',          value: healthLoading ? '…' : String(health?.ollama.models.length ?? 0), icon: '🧠', delay: 150, color: 'vanilla' },
          { label: 'Active Model',    value: health?.ollama.models[0]?.split(':')[0] ?? 'None', icon: '⚡', delay: 225, color: 'chocolate' },
        ].map((card) => (
          <StatCard key={card.label} {...card} color={card.color as string} />
        ))}
      </div>

      {/* Ollama status banners */}
      {health && !health.ollama.connected && !healthLoading && (
        <div className="p-4 bg-strawberry-100 dark:bg-strawberry-800/20 border border-strawberry-400 dark:border-strawberry-700 rounded-2xl animate-slide-in flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-chocolate-700 dark:text-strawberry-200">Ollama is not running</p>
            <p className="text-xs text-chocolate-500 dark:text-strawberry-300 mt-1">
              Start it and pull a model: <code className="font-mono bg-strawberry-200 dark:bg-strawberry-900 px-1.5 py-0.5 rounded">ollama pull qwen2.5-coder:7b</code>
            </p>
          </div>
        </div>
      )}

      {health?.ollama.connected && (
        <div className="p-4 bg-mint-200 dark:bg-mint-600/10 border border-mint-400 dark:border-mint-600 rounded-2xl animate-slide-in flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-chocolate-700 dark:text-mint-200">Ollama connected</p>
            <p className="text-xs text-chocolate-500 dark:text-mint-300 mt-0.5">
              {health.ollama.models.join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-chocolate-600 dark:text-cream-300 uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction to="/upload" icon="⬆️" label="Upload a File"   description="Single source file"   delay={0} />
          <QuickAction to="/upload" icon="🗜️" label="Upload ZIP"       description="Entire project archive" delay={75} />
          <QuickAction to="/upload" icon="🐙" label="Import GitHub"   description="Public repository"    delay={150} />
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-chocolate-600 dark:text-cream-300 uppercase tracking-widest">
            Recent Projects
          </h2>
          <Link to="/history" className="text-xs text-caramel-600 dark:text-caramel-400 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner size="md" label="Loading projects…" />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-cream-300 dark:border-chocolate-700 rounded-2xl">
            <p className="text-4xl mb-3 animate-float">📭</p>
            <p className="text-sm text-chocolate-400 dark:text-cream-500">No projects yet</p>
            <Link to="/upload" className="mt-3 inline-block text-sm text-caramel-600 dark:text-caramel-400 hover:underline font-medium">
              Upload your first project
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentProjects.map((p, i) => (
              <Link
                key={p.id}
                to={`/documentation?project=${p.id}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="flex items-center gap-4 p-4 bg-cream-50 dark:bg-chocolate-900 rounded-2xl border border-cream-300 dark:border-chocolate-700 hover:border-caramel-400 dark:hover:border-caramel-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
              >
                <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/40 flex items-center justify-center text-xl flex-shrink-0">
                  {p.source_type === 'github' ? '🐙' : p.source_type === 'zip' ? '🗜️' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-chocolate-700 dark:text-cream-100 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-chocolate-400 dark:text-cream-500">{formatDate(p.created_at)}</p>
                </div>
                {p.language_stats && (
                  <div className="hidden sm:flex gap-1">
                    {Object.keys(p.language_stats).slice(0, 3).map((lang) => (
                      <span key={lang} title={lang} className="text-base">{languageIcon(lang)}</span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-chocolate-400 dark:text-cream-500 tabular-nums">
                  {p.file_count ?? 0} files
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, delay }: {
  label: string; value: string; icon: string; color: string; delay: number;
}) {
  const bg: Record<string, string> = {
    caramel:    'from-caramel-400 to-caramel-600',
    mint:       'from-mint-400 to-mint-600',
    strawberry: 'from-strawberry-400 to-strawberry-600',
    vanilla:    'from-cream-300 to-caramel-200',
    chocolate:  'from-chocolate-500 to-chocolate-700',
  };
  const gradient = bg[color] ?? bg.caramel;

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 animate-fade-up`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm opacity-85 mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({ to, icon, label, description, delay }: {
  to: string; icon: string; label: string; description: string; delay: number;
}) {
  return (
    <Link
      to={to}
      style={{ animationDelay: `${delay}ms` }}
      className="flex items-center gap-4 p-5 bg-cream-50 dark:bg-chocolate-900 rounded-2xl border border-cream-300 dark:border-chocolate-700 hover:border-caramel-400 dark:hover:border-caramel-600 hover:shadow-md hover:-translate-y-1 transition-all duration-200 animate-fade-up group"
    >
      <span className="text-2xl group-hover:animate-float">{icon}</span>
      <div>
        <p className="font-semibold text-chocolate-700 dark:text-cream-100 text-sm">{label}</p>
        <p className="text-xs text-chocolate-400 dark:text-cream-500 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
