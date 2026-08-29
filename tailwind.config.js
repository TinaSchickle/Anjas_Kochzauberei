/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Clean, modern turquoise-blue palette.
        // Token names kept (terracotta/sage/cream/cocoa) so components need no
        // changes — only the values are retuned toward cool, vivid tones.
        cream: {
          // cool, clean neutrals
          50: '#F2F8F8',
          100: '#DFEEEE',
          200: '#C4DEE0',
        },
        terracotta: {
          // vivid turquoise — the primary accent
          50: '#E3F6F5',
          100: '#BEEAE7',
          300: '#6FCEC7',
          400: '#3BB8AF',
          500: '#0FA39A',
          600: '#0C857D',
          700: '#096863',
        },
        sage: {
          // deep sky blue — the secondary accent
          50: '#E8EFF9',
          100: '#C7D9F1',
          300: '#83A9DE',
          400: '#5487CC',
          500: '#3068B3',
          600: '#245096',
        },
        cocoa: {
          // dark blue-slate text tones
          400: '#5C7B82',
          600: '#33525A',
          800: '#152A2E',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -6px rgba(10, 60, 64, 0.16)',
        card: '0 6px 24px -8px rgba(10, 60, 64, 0.20)',
        lift: '0 12px 34px -10px rgba(10, 60, 64, 0.28)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
