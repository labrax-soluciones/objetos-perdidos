/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#5a6fd6',
          light: '#764ba2'
        },
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#ff9800'
      }
    }
  },
  plugins: []
}
