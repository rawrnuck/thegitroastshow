/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          teal: '#00CEC9',
          green: '#00B894',
          dark: '#00A085',
          darker: '#008B75',
        },
        accent: {
          cyan: '#00FFFF',
          light: '#E6FFFA',
        },
        bg: {
          dark: '#0D1117',
          darker: '#161B22',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typewriter': 'typewriter 0.5s steps(1, end)',
        'blink': 'blink 1s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        typewriter: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        glow: {
          'from': {
            textShadow: '0 0 5px #00CEC9, 0 0 10px #00CEC9, 0 0 15px #00CEC9',
          },
          'to': {
            textShadow: '0 0 10px #00CEC9, 0 0 20px #00CEC9, 0 0 30px #00CEC9',
          },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 206, 201, 0.5)',
        'glow-strong': '0 0 30px rgba(0, 206, 201, 0.8)',
      },
    },
  },
  plugins: [],
}
