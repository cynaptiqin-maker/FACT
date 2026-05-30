/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nile: {
          50:  '#e8eef0',
          100: '#c5d5da',
          200: '#9fb9c1',
          300: '#789da8',
          400: '#5a8896',
          500: '#3c7384',
          600: '#2e5f6e',
          700: '#254e5b',
          800: '#1C3741',   // Nile Blue — primary brand
          900: '#142830',
        },
        pearl: {
          50:  '#ffffff',
          100: '#FFF7E6',   // Pearl — primary background
          200: '#faefd4',
          300: '#f5e7c1',
          400: '#f0dfae',
          500: '#e8d49a',
        },
        // FACT Brand Colors
        brand: {
          50: '#e8eef0',
          100: '#c5d5da',
          200: '#9fb9c1',
          300: '#789da8',
          400: '#5a8896',
          500: '#3c7384',
          600: '#2e5f6e',
          700: '#254e5b',
          800: '#1C3741',
          900: '#142830',
        },
        // Finance-specific semantic colors
        revenue: {
          light: '#dcfce7',
          DEFAULT: '#16a34a',
          dark: '#15803d',
        },
        expense: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
        },
        profit: {
          light: '#d1fae5',
          DEFAULT: '#059669',
          dark: '#047857',
        },
        loss: {
          light: '#fef2f2',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        pending: {
          light: '#fef3c7',
          DEFAULT: '#d97706',
          dark: '#b45309',
        },
        // Sidebar — Nile Blue palette
        sidebar: {
          bg:         '#1C3741',
          hover:      '#254e5b',
          active:     '#2e5f6e',
          text:       'rgba(255,247,230,0.55)',
          textActive: '#FFF7E6',
          border:     'rgba(255,247,230,0.08)',
        },
        // Status colors
        status: {
          draft: '#6b7280',
          pending: '#d97706',
          active: '#16a34a',
          posted: '#16a34a',
          approved: '#0891b2',
          rejected: '#dc2626',
          cancelled: '#9ca3af',
          settled: '#059669',
          partial: '#ca8a04',
        },
      },
      fontFamily: {
        display: ['"Open Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        number: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'amount-xl': ['1.75rem', { lineHeight: '2rem', fontWeight: '700' }],
        'amount-lg': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'amount-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
      },
      spacing: {
        sidebar: '260px',
        topbar: '60px',
      },
      borderRadius: {
        card: '0.75rem',
        badge: '0.375rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        kpi: '0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.1)',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-in',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
