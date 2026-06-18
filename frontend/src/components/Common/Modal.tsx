import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-chocolate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${width} bg-cream-50 dark:bg-chocolate-900 rounded-2xl shadow-2xl border border-cream-300 dark:border-chocolate-700 animate-bounce-in overflow-hidden`}>
        {/* Header stripe */}
        <div className="h-1 bg-gradient-to-r from-caramel-400 via-strawberry-400 to-mint-400" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300 dark:border-chocolate-700">
          <h2 className="text-base font-semibold text-chocolate-700 dark:text-cream-100">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-chocolate-400 hover:text-chocolate-600 dark:text-cream-400 dark:hover:text-cream-100 hover:bg-cream-200 dark:hover:bg-chocolate-800 transition-all text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
