/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c0d0ff',
          300: '#93b0ff',
          400: '#5f84ff',
          500: '#3358ff',
          600: '#1a35f5',
          700: '#1323e1',
          800: '#1620b6',
          900: '#182090',
          950: '#111457',
        },
        brand: {
          navy: '#0f1b4c',
          navyLight: '#1a2a6c',
          navyDark: '#080e2b',
          orange: '#f97316',
          orangeLight: '#fb923c',
          orangeDark: '#ea580c',
          gold: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
