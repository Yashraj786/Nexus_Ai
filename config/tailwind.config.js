module.exports = {
  content: [
    './app/views/**/*.html.erb',
    './app/helpers/**/*.rb',
    './app/frontend/**/*.js',
    './app/frontend/**/*.jsx'
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#f8f8f8',
          surface: '#ffffff',
          dark: '#e8e8e8',
          accent: '#ff6b35',
          'accent-light': '#ff8c5a',
          'accent-bright': '#ffa86b',
          border: '#d0d0d0',
          'border-light': '#e0e0e0',
          text: '#1a1a1a',
          'text-secondary': '#555555',
          'text-accent': '#ff6b35',
        }
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 107, 53, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 107, 53, 0.4)',
        'glow-xl': '0 0 60px rgba(255, 107, 53, 0.5)',
      }
    }
  }
}
