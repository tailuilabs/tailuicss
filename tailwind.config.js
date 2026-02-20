/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './demo/**/*.{html,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('./src/plugin/index')(),
  ],
};