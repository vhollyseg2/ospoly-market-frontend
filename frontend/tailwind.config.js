export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#F5F3FF', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9' },
        flexia: { midnight: '#0B0A16', surface: '#141226', indigo: '#6366F1', amber: '#F59E0B' }
      },
      boxShadow: { flexia: '0 18px 50px rgba(76,29,149,.18)' }
    },
  },
}
