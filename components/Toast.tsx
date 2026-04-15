'use client';

import { useEffect, useState } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners: ((toast: Toast) => void)[] = [];

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const newToast = { id: ++toastId, message, type };
  listeners.forEach(fn => fn(newToast));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return toasts;
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
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
