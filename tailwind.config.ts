import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F4F4F6',
        card: '#FFFFFF',
        border: '#EFEFEF',
        'border-2': '#E8E8E8',
        ink: '#0F0F14',
        'ink-2': '#5A5A6E',
        'ink-3': '#A0A0B0',
        accent: {
          green: '#00C07F',
          'green-bg': '#E6FAF3',
          red: '#FF4060',
          'red-bg': '#FFF0F3',
          blue: '#3B82F6',
          'blue-bg': '#EEF4FF',
          amber: '#F59E0B',
          'amber-bg': '#FFFBEB',
          purple: '#8B5CF6',
          'purple-bg': '#F3EEFF',
          teal: '#06B6D4',
          'teal-bg': '#ECFEFF',
          rose: '#F43F5E',
          'rose-bg': '#FFF1F2',
        },
      },
      fontFamily: {
        display: ['var(--font-nunito)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        card: '22px',
        sm: '14px',
        xs: '10px',
        pill: '100px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.07)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.12)',
        fab: '0 6px 20px rgba(15,15,20,0.30)',
      },
    },
  },
  plugins: [],
}
export default config
