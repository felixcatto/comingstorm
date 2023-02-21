const defaultTheme = require('tailwindcss/defaultTheme');
const { rem2px } = require('./lib/devUtils');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./client/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}'],
  theme: {
    spacing: rem2px(defaultTheme.spacing),
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.14)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.25), 0 1px 2px -1px rgb(0 0 0 / 0.25)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.25), 0 2px 4px -2px rgb(0 0 0 / 0.25)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.25), 0 4px 6px -4px rgb(0 0 0 / 0.25)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)',
    },
    extend: {
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
  corePlugins: { container: false },
};
