const config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0891b2',
        'primary-dark': '#0e7490',
        'surface-light': '#ffffff',
        'surface-dark': '#1e293b',
      },
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'sans-serif'],
        'heading': ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
}

module.exports = config
