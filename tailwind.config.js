import daisyui from 'daisyui';
import daisyui0 from 'daisyui/src/theming/themes';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './*.html', './src/**/*.html'],
  theme: {
    extend: {
      colors: {
        'delayo-orange': '#FF7A00',
        'delayo-purple': '#8A05BE',
        'delayo-yellow': '#FFD700',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          ...daisyui0.light,
          'primary': '#FF7A00',
          'primary-content': '#3B1B00',
        }
      },
      {
        dark: {
          ...daisyui0.dark,
          'base-100': '#1a1e2e',
          'base-200': '#2a3142',
          'base-300': '#3a4255',
          'base-content': '#e2e8f0',
          'primary': '#FF7A00',
          'primary-content': '#e2e8f0',
        },
      },
    ],
    darkTheme: 'dark',
  },
};
