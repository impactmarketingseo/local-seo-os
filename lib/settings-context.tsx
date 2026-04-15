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

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
        
        // Apply branding settings
        if (data.branding) {
          if (data.branding.accent_color) {
            document.documentElement.style.setProperty('--app-accent', data.branding.accent_color);
            document.documentElement.style.setProperty('--primary', data.branding.accent_color);
            document.documentElement.style.setProperty('--ring', data.branding.accent_color);
            document.documentElement.style.setProperty('--accent', data.branding.accent_color);
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setLoading(false);
    }

    loadSettings();
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
