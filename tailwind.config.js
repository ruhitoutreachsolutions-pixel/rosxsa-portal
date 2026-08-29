/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0A0A0A',      // Foundation 70%
          navy: '#111827',       // Surface 20%
          midnight: '#1E3A5F',   // Overlay
          cyan: '#00C2FF',       // Primary Accent & Headlines
          green: '#00E5A0',      // KPIs & Numbers
          orange: '#F97316',     // Logo dot & Alerts
          gray: '#7B7B7B',       // Muted text
          white: '#FFFFFF',      // Pure white
          card: '#0d131f',
          'card-hover': '#152033',
          border: 'rgba(0, 194, 255, 0.15)',
          'border-active': 'rgba(0, 194, 255, 0.4)',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px -3px rgba(0, 194, 255, 0.35)',
        'green-glow': '0 0 25px -3px rgba(0, 229, 160, 0.35)',
        'orange-glow': '0 0 25px -3px rgba(249, 115, 22, 0.35)',
        'card-dark': '0 4px 25px -2px rgba(0, 0, 0, 0.7)',
      }
    },
  },
  plugins: [],
};
