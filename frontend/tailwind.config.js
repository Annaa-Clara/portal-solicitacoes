/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        fundo: 'hsl(var(--fundo) / <alpha-value>)',
        superficie: 'hsl(var(--superficie) / <alpha-value>)',
        elevada: 'hsl(var(--elevada) / <alpha-value>)',
        borda: 'hsl(var(--borda) / <alpha-value>)',
        texto: 'hsl(var(--texto) / <alpha-value>)',
        suave: 'hsl(var(--suave) / <alpha-value>)',
        marca: {
          DEFAULT: 'hsl(var(--marca) / <alpha-value>)',
          forte: 'hsl(var(--marca-forte) / <alpha-value>)',
          fundo: 'hsl(var(--marca-fundo) / <alpha-value>)',
        },
        perigo: 'hsl(var(--perigo) / <alpha-value>)',
      },
      boxShadow: {
        cartao: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        flutuante: '0 10px 38px -10px rgb(15 23 42 / 0.25), 0 10px 20px -15px rgb(15 23 42 / 0.2)',
      },
      keyframes: {
        entrar: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'zoom-in': { from: { opacity: 0, transform: 'scale(.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        entrar: 'entrar .25s ease-out both',
        'fade-in': 'fade-in .15s ease-out both',
        'zoom-in': 'zoom-in .18s ease-out both',
      },
    },
  },
  plugins: [],
};
