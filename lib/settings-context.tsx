'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface AppSettings {
  branding?: {
    logo_url?: string | null;
    app_name?: string;
    accent_color?: string;
  };
  general?: {
    timezone?: string;
  };
}

interface AppSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  updateSettings: (settings: AppSettings) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: null,
  loading: true,
  updateSettings: () => {},
});

export function useAppSettings() {
  return useContext(AppSettingsContext);
}

function applyBranding(branding: AppSettings['branding']) {
  if (!branding) return;
  
  if (branding.accent_color) {
    document.documentElement.style.setProperty('--app-accent', branding.accent_color);
    document.documentElement.style.setProperty('--primary', branding.accent_color);
    document.documentElement.style.setProperty('--ring', branding.accent_color);
    document.documentElement.style.setProperty('--accent', branding.accent_color);
  }
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
        
        // Apply branding settings on load
        if (data.branding) {
          applyBranding(data.branding);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setLoading(false);
    }

    loadSettings();
    
    // Listen for settings updates from other components
    const handleSettingsUpdate = (e: CustomEvent) => {
      const newSettings = e.detail;
      setSettings(prev => ({ ...prev, ...newSettings }));
      if (newSettings.branding) {
        applyBranding(newSettings.branding);
      }
    };
    
    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
  }, []);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}
