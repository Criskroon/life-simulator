/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        health: '#ef4444',
        happiness: '#facc15',
        smarts: '#3b82f6',
        looks: '#ec4899',
      },
      maxWidth: {
        phone: '480px',
      },
    },
  },
  plugins: [],
};
