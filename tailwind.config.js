/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          950: '#120000',
          900: '#2D0000',
          800: '#450000',
          700: '#5C0A0A',
          600: '#7A1010',
          500: '#8B1A1A',
        },
        gold: {
          900: '#5C4500',
          800: '#7A5C00',
          700: '#967200',
          600: '#B08A00',
          500: '#C9A84C',
          400: '#D4B75A',
          300: '#E0C978',
          200: '#ECD99A',
          100: '#F5ECC8',
          50:  '#FBF5E0',
        },
        cream: '#FDF3DC',
      },
      fontFamily: {
        cinzel:     ['Cinzel', 'Georgia', 'serif'],
        cormorant:  ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'fade-in':    'fade-in 0.25s ease-out',
        'slide-up':   'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-gold': {
          '0%,100%': { boxShadow: '0 0 8px rgba(201,168,76,0.25)' },
          '50%':      { boxShadow: '0 0 20px rgba(201,168,76,0.6)' },
        },
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
