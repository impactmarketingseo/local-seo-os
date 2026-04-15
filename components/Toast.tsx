'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const newToast = { id: ++toastId, message, type };
  listeners.forEach(fn => fn(newToast));
}

const emptyStore = () => [];
const subscribe = (callback: (t: Toast) => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export function useToastStore() {
  return useSyncExternalStore(subscribe, emptyStore, emptyStore);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToast: Toast) => {
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg animate-slide-in max-w-sm ${
            t.type === 'success' ? 'bg-success text-white' :
            t.type === 'error' ? 'bg-error text-white' :
            'bg-elevated text-text-primary border border-border'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
