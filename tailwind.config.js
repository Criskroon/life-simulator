/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sunny Side — Backgrounds
        cream: { DEFAULT: '#FBF4E4', light: '#FEF9EC', dark: '#F4ECD7' },
        // Sunny Side — Brand
        coral: { DEFAULT: '#E8714A', dark: '#D55B30', light: '#F2A285' },
        peach: { DEFAULT: '#F5C094', light: '#FBE0CC' },
        brass: '#C8954D',
        // Sunny Side — Section colors (8 Activities sections)
        section: {
          body: '#7CA17A',
          mind: '#3D7E7B',
          town: '#C4953C',
          heart: '#C77B8E',
          wallet: '#8E8245',
          shop: '#E8714A',
          shadows: '#3D342E',
          mirror: '#9B7EA9',
        },
        // Sunny Side — Stats (vibrant + muted)
        stat: {
          health: { DEFAULT: '#D85A4F', muted: '#E89C95' },
          happiness: { DEFAULT: '#E8B144', muted: '#F2D499' },
          smarts: { DEFAULT: '#5085B5', muted: '#A4C2DD' },
          looks: { DEFAULT: '#D479A9', muted: '#E8B5D2' },
        },
        // Sunny Side — Status
        success: '#5D9573',
        warning: '#D4A042',
        danger: '#B5524A',
        neutral: '#8B8076',
        // Sunny Side — Ink (text)
        ink: { DEFAULT: '#2A1F18', soft: '#5C4F44', faint: '#A89B8E' },
        // Legacy stat colors (still used by existing StatBar / GameScreen)
        // — kept until those components are migrated in later phases.
        health: '#ef4444',
        happiness: '#facc15',
        smarts: '#3b82f6',
        looks: '#ec4899',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        warm: '0 2px 8px rgba(232, 113, 74, 0.08)',
        'warm-lg': '0 4px 16px rgba(232, 113, 74, 0.12)',
      },
      maxWidth: {
        phone: '480px',
      },
    },
  },
  plugins: [],
};
