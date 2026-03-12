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
        'background-light': '#f0f4f8',
        'background-dark': '#0f172a',
        'surface-light': '#ffffff',
        'surface-dark': '#1e293b',
        'text-main': '#1e293b',
        'text-sub': '#64748b',
        'accent-blue': '#0ea5e9',
      },
      borderRadius: {
        'DEFAULT': '1rem',
        'lg': '2rem',
        'xl': '3rem',
        'full': '9999px',
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
