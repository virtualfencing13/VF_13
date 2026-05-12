/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      colors: {
        surface: '#0f1117',
        card: '#1a1d27',
        border: '#2a2d3a',
        green: { DEFAULT: '#22c55e', dim: 'rgba(34,197,94,0.12)' },
        red:   { DEFAULT: '#ef4444', dim: 'rgba(239,68,68,0.12)'  },
        amber: { DEFAULT: '#f59e0b' },
        blue:  { DEFAULT: '#3b82f6' },
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'flash':      'flash 1.4s ease-in-out infinite',
        'slide-in':   'slideIn 0.3s ease-out',
      },
      keyframes: {
        flash:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
