/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial da Bateria Mauá (Clube da Manga).
        manga: {
          orange: '#F89109',
          orangeDark: '#E35202',
          red: '#AA0001',
          green: '#7A8836',
          gray: '#4B4A4A',
          white: '#FDFDFD',
          black: '#000000'
        },
        surface: '#FFF8F1',
        card: '#FDFDFD',
        border: '#F0E1D1',
        textPrimary: '#1F1A16',
        accentSoft: '#FFEEDD'
      },
      fontFamily: {
        sans: ['LibreFranklin_400Regular'],
        medium: ['LibreFranklin_500Medium'],
        semibold: ['LibreFranklin_600SemiBold'],
        bold: ['LibreFranklin_700Bold'],
        black: ['LibreFranklin_900Black']
      }
    },
  },
  plugins: [],
}
