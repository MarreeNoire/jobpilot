/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/**/*.{js,ts,jsx,tsx}",
    "./packages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // JobPilot distinctive palette
        'jobpilot': {
          primary: '#1E3A8A',      // blue-800
          cvs: '#065F46',          // emerald-800
          preferences: '#0284C7',  // sky-600
          status: '#EA580C',       // orange-600
        }
      }
    }
  },
  plugins: [],
}