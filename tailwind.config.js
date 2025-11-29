/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'stalker': ['"AmazS.T.A.L.K.E.R.Italic"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
