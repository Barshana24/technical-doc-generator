import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/',              label: 'Dashboard',     icon: '⬛' },
  { to: '/upload',        label: 'Upload',         icon: '⬆' },
  { to: '/documentation', label: 'Documentation',  icon: '📄' },
  { to: '/history',       label: 'History',        icon: '🕐' },
  { to: '/settings',      label: 'Settings',       icon: '⚙' },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile = false, onClose }: SidebarProps) {
  return (
    <aside className={`flex flex-col h-full ${mobile ? '' : 'w-64'} bg-chocolate-700 dark:bg-chocolate-900 border-r border-chocolate-600 dark:border-chocolate-800`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-chocolate-600 dark:border-chocolate-800">
        <div className="w-9 h-9 rounded-xl bg-caramel-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          TD
        </div>
        <div>
          <p className="font-semibold text-cream-100 text-sm tracking-wide">TechDoc</p>
          <p className="text-xs text-caramel-300">AI Generator</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="ml-auto text-cream-300 hover:text-cream-100">
            ✕
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-caramel-500 text-white shadow-sm'
                  : 'text-cream-300 hover:bg-chocolate-600 dark:hover:bg-chocolate-800 hover:text-cream-100'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-chocolate-600 dark:border-chocolate-800">
        <p className="text-xs text-caramel-400 text-center">
          Powered by Ollama + Qwen Coder
        </p>
      </div>
    </aside>
  );
}
