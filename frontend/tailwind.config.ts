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
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
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
          backdrop: 'var(--bg-modal-backdrop)',
          toolbar: 'var(--bg-toolbar)',
          'table-th': 'var(--bg-table-th)'
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)'
        },
        status: {
          success: 'var(--color-success)',
          'success-bg': 'var(--color-success-bg)',
          'success-border': 'var(--color-success-border)',
          warning: 'var(--color-warning)',
          'warning-bg': 'var(--color-warning-bg)',
          'warning-border': 'var(--color-warning-border)',
          danger: 'var(--color-danger)',
          'danger-bg': 'var(--color-danger-bg)',
          'danger-border': 'var(--color-danger-border)',
          info: 'var(--color-info)',
          'info-bg': 'var(--color-info-bg)',
          'info-border': 'var(--color-info-border)',
          purple: 'var(--color-purple)',
          'purple-bg': 'var(--color-purple-bg)',
          'purple-border': 'var(--color-purple-border)'
        },
        border: {
          subtle: 'var(--border-subtle)',
          medium: 'var(--border-medium)',
          focus: 'var(--border-focus)',
          accent: 'var(--border-accent)'
        }
      },
      borderColor: {
        DEFAULT: 'var(--border-subtle)',
        subtle: 'var(--border-subtle)',
        medium: 'var(--border-medium)',
        focus: 'var(--border-focus)',
        accent: 'var(--border-accent)'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace']
      },
      fontSize: {
        'page-title': ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        'section-title': ['16px', { lineHeight: '1.25', fontWeight: '600' }],
        'menu-heading': ['13px', { lineHeight: '1.2', fontWeight: '600' }],
        'sidebar-item': ['14px', { lineHeight: '1.3', fontWeight: '400' }],
        'sidebar-item-active': ['14px', { lineHeight: '1.3', fontWeight: '600' }],
        'form-label': ['12.5px', { lineHeight: '1.2', fontWeight: '500' }],
        'input': ['13px', { lineHeight: '1.2', fontWeight: '400' }],
        'table-header': ['12px', { lineHeight: '1.2', fontWeight: '600' }],
        'table-data': ['13px', { lineHeight: '1.25', fontWeight: '400' }],
        'status-badge': ['11px', { lineHeight: '1.1', fontWeight: '600' }],
        'breadcrumb': ['12.5px', { lineHeight: '1.2', fontWeight: '400' }],
        'pagination': ['12.5px', { lineHeight: '1.2', fontWeight: '500' }]
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        full: '9999px'
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        card: 'var(--shadow-sm)',
        dropdown: 'var(--shadow-md)',
        modal: 'var(--shadow-xl)'
      },
      spacing: {
        sidebar: '280px',
        'sidebar-collapsed': '72px',
        header: '70px',
        ctrl: '34px',
        'ctrl-sm': '30px',
        'ctrl-xs': '26px',
        btn: '32px',
        'btn-sm': '28px',
        'btn-icon': '28px'
      }
    }
  },
  plugins: []
};
