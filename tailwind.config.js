/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Quicksand', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
      },
      colors: {
        vanilla:  { DEFAULT: '#FFFDD0', dark: '#F5F0B8' },
        sage:     { 50: '#EAF2EC', 100: '#C8DED0', 200: '#A0C4B0', 300: '#78A98E', 400: '#5C9275', 500: '#4A7D62', DEFAULT: '#8AB49A', 600: '#3A6650', 700: '#2C4F3D' },
        rose:     { 50: '#FAEAEA', 100: '#F4CECE', 200: '#EEACAC', DEFAULT: '#D4848A', 300: '#D4848A', 400: '#C46068', 500: '#A8454E', 600: '#8A323A' },
        cream:    { DEFAULT: '#FAF7F0', dark: '#F0EBE0' },
        petal: {
          joy:    '#FFD93D',
          calm:   '#87CEAB',
          sad:    '#91A7D0',
          love:   '#E8B4B8',
          fire:   '#FF8B64',
          dream:  '#C9ADE8',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft':    '0 2px 20px rgba(74,63,74,0.08)',
        'medium':  '0 4px 32px rgba(74,63,74,0.12)',
        'card':    '0 1px 4px rgba(74,63,74,0.06)',
      },
      animation: {
        'bloom':     'bloom 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'bob':       'bob 3.5s ease-in-out infinite',
        'fade-up':   'fadeUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'squish':    'squish 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'nudge-in':  'nudgeIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'stagger-1': 'fadeUp 0.4s 0.05s cubic-bezier(0.34,1.56,0.64,1) both',
        'stagger-2': 'fadeUp 0.4s 0.10s cubic-bezier(0.34,1.56,0.64,1) both',
        'stagger-3': 'fadeUp 0.4s 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
        'stagger-4': 'fadeUp 0.4s 0.20s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        bloom:   { from: { transform: 'scale(0)' }, to: { transform: 'scale(1)' } },
        bob:     { '0%,100%': { transform: 'translateY(0) rotate(-4deg)' }, '50%': { transform: 'translateY(-6px) rotate(4deg)' } },
        fadeUp:  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        squish:  { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(0.92)' } },
        nudgeIn: { from: { opacity: '0', transform: 'scale(0.95) translateY(4px)' }, to: { opacity: '1', transform: 'scale(1) translateY(0)' } },
      },
    },
  },
  plugins: [],
}
