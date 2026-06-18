import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../Common/Toast';

const PAGE_TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/upload':        'Upload Code',
  '/documentation': 'Documentation',
  '/history':       'History',
  '/settings':      'Settings',
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => location.pathname.startsWith(path))?.[1] ?? 'TechDoc';

  return (
    <div className="flex h-screen bg-cream-100 dark:bg-chocolate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex animate-fade-in">
          <div className="absolute inset-0 bg-chocolate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-72 animate-slide-in-left">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
