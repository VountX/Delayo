import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './*.html', './src/**/*.html'],
  theme: {
    extend: {
      colors: {
        'delayo-orange': '#FF7A00', // Cor laranja elegante e moderna
        'delayo-purple': '#8A05BE',
        'delayo-yellow': '#FFD700', // Amarelo substituindo o laranja
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      'light',
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          'base-100': '#1a1e2e', // Fundo do popup um pouco mais claro e com tom azulado
          'base-200': '#2a3142', // Fundo dos cards mais claro que o base-100 para criar contraste
          'base-300': '#3a4255', // Elementos de destaque ainda mais claros
          'base-content': '#e2e8f0', // Texto principal com tom suave
        },
      },
    ],
    darkTheme: 'dark', // name of one of the included themes for dark mode
  },
};
