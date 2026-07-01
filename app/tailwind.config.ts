import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--ti-bg)',
        surface: 'var(--ti-surface)',
        'surface-2': 'var(--ti-surface-2)',
        text: 'var(--ti-text)',
        'text-soft': 'var(--ti-text-soft)',
        'text-faint': 'var(--ti-text-faint)',
        accent: 'var(--ti-accent)',
        'on-accent': 'var(--ti-on-accent)',
        line: 'var(--ti-line)',
        'line-strong': 'var(--ti-line-strong)',
        chip: 'var(--ti-chip)',
        sale: 'var(--ti-sale)',
        success: 'var(--ti-success)',
        'success-bg': 'var(--ti-success-bg)',
        danger: 'var(--ti-danger)',
        'danger-bg': 'var(--ti-danger-bg)',
        warning: 'var(--ti-warning)',
        'warning-bg': 'var(--ti-warning-bg)',
        info: 'var(--ti-info)',
        'info-bg': 'var(--ti-info-bg)',
      },
      borderRadius: {
        sm: 'var(--ti-radius-sm)',
        md: 'var(--ti-radius-md)',
        lg: 'var(--ti-radius-lg)',
        pill: 'var(--ti-radius-pill)',
      },
      fontFamily: {
        sans: 'var(--ti-font-sans)',
      },
      maxWidth: {
        container: 'var(--ti-container)',
      },
      boxShadow: {
        ti: 'var(--ti-shadow)',
        'ti-sm': 'var(--ti-shadow-sm)',
        'ti-lg': 'var(--ti-shadow-lg)',
      },
    },
  },
  plugins: [],
} satisfies Config;
