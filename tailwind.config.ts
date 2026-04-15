import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        app: '#0A0B0F',
        sidebar: '#0F1117',
        card: '#141620',
        elevated: '#1A1D2B',
        input: '#222639',
        border: '#2A2F45',
        
        // Text hierarchy
        text: {
          primary: '#F1F3F9',
          secondary: '#C4C9DB',
          tertiary: '#7A8199',
          disabled: '#4A5068',
        },
        
        // Accent - Electric Blue
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          active: '#1D4ED8',
          glow: 'rgba(59, 130, 246, 0.12)',
          glowSubtle: 'rgba(59, 130, 246, 0.06)',
        },
        
        // Semantic status colors
        success: {
          DEFAULT: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.12)',
        },
        error: {
          DEFAULT: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.12)',
        },
        info: {
          DEFAULT: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.12)',
        },
        
        // Border
        'border-light': 'rgba(42, 47, 69, 0.5)',
        
        // Legacy shadcn mappings (only ring kept)
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.08)',
        'glow': '0 0 30px rgba(59, 130, 246, 0.06)',
        'glow-pulse': '0 0 30px rgba(59, 130, 246, 0.08)',
        'button': '0 2px 8px rgba(59, 130, 246, 0.25)',
        'button-hover': '0 4px 16px rgba(59, 130, 246, 0.35)',
      },
      animation: {
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.04)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;