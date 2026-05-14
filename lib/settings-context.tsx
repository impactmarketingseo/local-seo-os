'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface AppSettings {
  branding?: {
    logo_url?: string | null;
    app_name?: string;
    accent_color?: string;
    accent_color_2?: string;
    use_gradient?: boolean;
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
  
  const accent = branding.accent_color || '#3B82F6';
  const accent2 = branding.accent_color_2 || '#2563EB';
  const useGradient = branding.use_gradient || false;
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };
  
  const darken = (rgb: {r: number, g: number, b: number}, percent: number) => {
    return `#${Math.max(0, Math.floor(rgb.r * (1 - percent))).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(rgb.g * (1 - percent))).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(rgb.b * (1 - percent))).toString(16).padStart(2, '0')}`;
  };
  
  document.documentElement.style.setProperty('--app-accent', accent);
  document.documentElement.style.setProperty('--primary', accent);
  document.documentElement.style.setProperty('--ring', accent);
  document.documentElement.style.setProperty('--accent', accent);
  
  if (useGradient) {
    document.documentElement.style.setProperty('--app-accent-hover', accent2);
    document.documentElement.style.setProperty('--app-accent-active', darken(hexToRgb(accent), 0.15));
    document.documentElement.style.setProperty('--app-accent-gradient', `linear-gradient(135deg, ${accent}, ${accent2})`);
  } else {
    const rgb = hexToRgb(accent);
    document.documentElement.style.setProperty('--app-accent-hover', darken(rgb, 0.1));
    document.documentElement.style.setProperty('--app-accent-active', darken(rgb, 0.2));
    document.documentElement.style.setProperty('--app-accent-gradient', `linear-gradient(135deg, ${accent}, ${darken(hexToRgb(accent), 0.1)})`);
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
