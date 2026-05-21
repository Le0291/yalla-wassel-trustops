/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Stitch / Material Design 3 — Yalla Wassel Logistics Pro
        'surface':                    '#f8f9ff',
        'surface-dim':                '#d7dae1',
        'surface-bright':             '#f8f9ff',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#f1f3fb',
        'surface-container':          '#ebeef5',
        'surface-container-high':     '#e5e8ef',
        'surface-container-highest':  '#e0e2ea',
        'on-surface':                 '#181c21',
        'on-surface-variant':         '#404751',
        'inverse-surface':            '#2d3136',
        'inverse-on-surface':         '#eef1f8',
        'outline':                    '#707883',
        'outline-variant':            '#c0c7d3',
        'surface-tint':               '#0062a2',
        'surface-variant':            '#e0e2ea',

        'primary':                    '#005f9e',
        'on-primary':                 '#ffffff',
        'primary-container':          '#0078c6',
        'on-primary-container':       '#fdfcff',
        'primary-fixed':              '#d1e4ff',
        'primary-fixed-dim':          '#9dcaff',
        'on-primary-fixed':           '#001d35',
        'on-primary-fixed-variant':   '#00497b',
        'inverse-primary':            '#9dcaff',

        'secondary':                  '#565e74',
        'on-secondary':               '#ffffff',
        'secondary-container':        '#dae2fd',
        'on-secondary-container':     '#5c647a',
        'secondary-fixed':            '#dae2fd',
        'secondary-fixed-dim':        '#bec6e0',
        'on-secondary-fixed':         '#131b2e',
        'on-secondary-fixed-variant': '#3f465c',

        'tertiary':                   '#8a4c00',
        'on-tertiary':                '#ffffff',
        'tertiary-container':         '#ae6100',
        'on-tertiary-container':      '#fffbff',
        'tertiary-fixed':             '#ffdcc1',
        'tertiary-fixed-dim':         '#ffb778',
        'on-tertiary-fixed':          '#2e1500',
        'on-tertiary-fixed-variant':  '#6c3a00',

        'error':                      '#ba1a1a',
        'on-error':                   '#ffffff',
        'error-container':            '#ffdad6',
        'on-error-container':         '#93000a',

        'background':                 '#f8f9ff',
        'on-background':              '#181c21',
      },
      fontSize: {
        'headline-lg':        ['32px', { lineHeight: '40px',  fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px',  fontWeight: '700' }],
        'headline-md':        ['20px', { lineHeight: '28px',  fontWeight: '600' }],
        'body-lg':            ['16px', { lineHeight: '24px',  fontWeight: '400' }],
        'body-md':            ['14px', { lineHeight: '20px',  fontWeight: '400' }],
        'label-sm':           ['12px', { lineHeight: '16px',  fontWeight: '600', letterSpacing: '0.05em' }],
        'data-mono':          ['14px', { lineHeight: '20px',  fontWeight: '500' }],
      },
      borderRadius: {
        'DEFAULT': '0.25rem', // 4px — tags, pips
        'lg':      '0.5rem',  // 8px — buttons, inputs, cards
        'xl':      '0.75rem', // 12px — large cards, modals
        'full':    '9999px',  // pills — status chips
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'hover': '0 4px 12px rgba(15,23,42,0.08)',
        'modal': '0 8px 24px rgba(15,23,42,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'pulse':   'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
