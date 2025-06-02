module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // Tree shaking agressivo
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    safelist: [
      // Classes dinâmicas que podem ser purgadas incorretamente
      'status-draft',
      'status-submitted', 
      'status-approved',
      /^status-/,
      /^btn-/,
      /^text-(red|green|blue|yellow)-(500|600|700)/
    ]
  },
  
  theme: {
    extend: {
      // Cores customizadas otimizadas
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
        }
      },
      
      // Animações performáticas
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideUp 300ms ease-out',
        'skeleton': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    
    // Plugin customizado para utilitários
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.text-balance': {
          'text-wrap': 'balance'
        }
      });
    }
  ],
};