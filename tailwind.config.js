/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        helm: {
          950: '#04060e',
          900: '#070a14',
          850: '#090d1a',
          800: '#0d1220',
          750: '#101828',
          700: '#141f30',
          650: '#192638',
          600: '#1d2d42',
          500: '#23364e',
          400: '#2b4060',
          300: '#3a5578',
          200: '#527296',
          100: '#7299be',
          50:  '#a4c5e2',
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)
        `,
        'grid-pattern-lg': `
          linear-gradient(rgba(245,158,11,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.05) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-sm': '24px 24px',
        'grid-md': '48px 48px',
        'grid-lg': '64px 64px',
      },
      boxShadow: {
        'amber-glow': '0 0 20px rgba(245,158,11,0.15)',
        'amber-glow-sm': '0 0 10px rgba(245,158,11,0.10)',
        'sky-glow': '0 0 20px rgba(14,165,233,0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
        'sidebar': '4px 0 24px rgba(0,0,0,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
