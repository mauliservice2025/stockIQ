/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          glow: 'var(--primary-glow)'
        },
        surface: {
          app: 'var(--bg-app)',
          sidebar: 'var(--bg-sidebar)',
          header: 'var(--bg-header)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          default: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          input: 'var(--bg-input)',
          modal: 'var(--bg-modal)',
          backdrop: 'var(--bg-modal-backdrop)'
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)'
        },
        status: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          danger: 'var(--color-danger)',
          info: 'var(--color-info)',
          purple: 'var(--color-purple)'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace']
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px'
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        dropdown: 'var(--shadow-md)',
        modal: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)'
      }
    }
  },
  plugins: []
};

