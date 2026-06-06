/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'a-blue':      '#0071e3',
        'a-blue-h':    '#0077ed',
        'a-bg':        '#ffffff',
        'a-bg2':       '#f5f5f7',
        'a-bg3':       '#e8e8ed',
        'a-black':     '#1d1d1f',
        'a-gray1':     '#6e6e73',
        'a-gray2':     '#86868b',
        'a-gray3':     '#aeaeb2',
        'a-green':     '#34c759',
        'a-red':       '#ff3b30',
        'a-orange':    '#ff9500',
        'a-purple':    '#af52de',
        'a-sep':       'rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'ap-xs': '6px',  'ap-sm': '10px', 'ap-md': '14px',
        'ap-lg': '20px', 'ap-xl': '24px', 'ap-2xl': '28px',
      },
      boxShadow: {
        'ap-xs': '0 1px 3px rgba(0,0,0,0.07)',
        'ap-sm': '0 2px 8px rgba(0,0,0,0.08)',
        'ap-md': '0 4px 16px rgba(0,0,0,0.10)',
        'ap-lg': '0 8px 32px rgba(0,0,0,0.12)',
        'ap-xl': '0 20px 60px rgba(0,0,0,0.14)',
        'ap-blue': '0 4px 20px rgba(0,113,227,0.35)',
      },
    },
  },
  plugins: [],
};
