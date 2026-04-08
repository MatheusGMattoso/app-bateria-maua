/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        manga: {
          orangeDark: '#E35202',
          orangeLight: '#F89109',
          red: '#AA0001',
          green: '#7A8836',
          gray: '#4B4A4A',
          white: '#FDFDFD',
          black: '#000000'
        }
      }
    },
  },
  plugins: [],
}

