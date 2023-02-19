/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
const { rem2px } = require('./lib/devUtils');

module.exports = {
  content: ['./client/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}'],
  theme: {
    spacing: rem2px(defaultTheme.spacing),
  },
  plugins: [],
  corePlugins: {
    container: false,
  },
};
