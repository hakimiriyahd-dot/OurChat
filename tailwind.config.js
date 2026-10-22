export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wa: {
          primary: '#075E54',
          secondary: '#128C7E',
          bubble: '#DCF8C6',
          bg: '#E5DDD5',
          sidebar: '#F0F2F5',
          dark: '#111B21',
          darkSidebar: '#202C33',
          darkChat: '#0B141A'
        }
      },
      fontFamily: {
        app: ['var(--font-family)', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
