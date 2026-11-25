/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f0ff',
          100: '#e7e3ff',
          200: '#d1caff',
          300: '#b3a5ff',
          400: '#9276ff',
          500: '#7550ff',
          600: '#6d5ef8',
          700: '#5a45d8',
          800: '#4a39ad',
          900: '#3f3389',
        },
        ink: {
          50: '#f6f7fb',
          100: '#eceef6',
          200: '#d8dcea',
          300: '#b6bed4',
          400: '#8b96b5',
          500: '#697596',
          600: '#525d7a',
          700: '#414a63',
          800: '#31384d',
          900: '#1c2233',
          950: '#0b1020',
        },
        mint: {
          50: '#ecfdf8',
          100: '#d0fbee',
          200: '#a4f5df',
          300: '#6be9cd',
          400: '#2fd4b5',
          500: '#16c7b4',
          600: '#0aa292',
          700: '#0c8277',
          800: '#0e6760',
          900: '#105550',
        },
        amber: {
          400: '#ffc24d',
          500: '#ffae1f',
          600: '#e08c00',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -6px rgba(16, 24, 40, 0.12)',
        lift: '0 2px 4px rgba(16, 24, 40, 0.05), 0 20px 40px -12px rgba(59, 51, 137, 0.28)',
        glow: '0 0 0 1px rgba(117, 80, 255, 0.16), 0 18px 48px -12px rgba(117, 80, 255, 0.45)',
      },
      borderRadius: {
        xl2: '1.25rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
