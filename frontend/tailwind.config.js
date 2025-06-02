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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      backdropBlur: {
        xs: '2px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.gray.700'),
            lineHeight: '1.7',
            fontSize: '16px',
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            h1: {
              fontSize: '2.25em',
              marginTop: '0',
              marginBottom: '0.8888889em',
              lineHeight: '1.1111111',
              fontWeight: '800',
              color: theme('colors.gray.900'),
            },
            h2: {
              fontSize: '1.875em',
              marginTop: '2em',
              marginBottom: '1em',
              lineHeight: '1.3333333',
              fontWeight: '700',
              color: theme('colors.gray.900'),
            },
            h3: {
              fontSize: '1.5em',
              marginTop: '1.6em',
              marginBottom: '0.6em',
              lineHeight: '1.6',
              fontWeight: '600',
              color: theme('colors.gray.900'),
            },
            h4: {
              marginTop: '1.5em',
              marginBottom: '0.5em',
              lineHeight: '1.5',
              fontWeight: '600',
              color: theme('colors.gray.900'),
            },
            blockquote: {
              fontWeight: '500',
              fontStyle: 'italic',
              color: theme('colors.gray.900'),
              borderLeftWidth: '0.25rem',
              borderLeftColor: theme('colors.primary.500'),
              quotes: '"\\201C""\\201D""\\2018""\\2019"',
              marginTop: '1.6em',
              marginBottom: '1.6em',
              paddingLeft: '1em',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.625em',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.625em',
            },
            'ul > li': {
              paddingLeft: '0.375em',
            },
            'ol > li': {
              paddingLeft: '0.375em',
            },
            'li::marker': {
              color: theme('colors.primary.500'),
            },
            a: {
              color: theme('colors.primary.600'),
              textDecoration: 'underline',
              fontWeight: '500',
              '&:hover': {
                color: theme('colors.primary.700'),
              },
            },
            strong: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
            },
            code: {
              color: theme('colors.gray.900'),
              backgroundColor: theme('colors.gray.100'),
              paddingLeft: '4px',
              paddingRight: '4px',
              paddingTop: '2px',
              paddingBottom: '2px',
              borderRadius: '0.375rem',
              fontSize: '0.875em',
              fontWeight: '600',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              color: theme('colors.gray.200'),
              backgroundColor: theme('colors.gray.800'),
              overflowX: 'auto',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
              marginTop: '1.7142857em',
              marginBottom: '1.7142857em',
              borderRadius: '0.375rem',
              paddingTop: '0.8571429em',
              paddingRight: '1.1428571em',
              paddingBottom: '0.8571429em',
              paddingLeft: '1.1428571em',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: '400',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            table: {
              width: '100%',
              tableLayout: 'auto',
              textAlign: 'left',
              marginTop: '2em',
              marginBottom: '2em',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
            },
            thead: {
              borderBottomWidth: '1px',
              borderBottomColor: theme('colors.gray.300'),
            },
            'thead th': {
              color: theme('colors.gray.900'),
              fontWeight: '600',
              verticalAlign: 'bottom',
              paddingRight: '0.5714286em',
              paddingBottom: '0.5714286em',
              paddingLeft: '0.5714286em',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: theme('colors.gray.200'),
            },
            'tbody td': {
              verticalAlign: 'top',
              paddingTop: '0.5714286em',
              paddingRight: '0.5714286em',
              paddingBottom: '0.5714286em',
              paddingLeft: '0.5714286em',
            },
          },
        },
        sm: {
          css: {
            fontSize: '14px',
            lineHeight: '1.6',
          },
        },
        lg: {
          css: {
            fontSize: '18px',
            lineHeight: '1.8',
          },
        },
        xl: {
          css: {
            fontSize: '20px',
            lineHeight: '1.8',
          },
        },
      }),
    },
  },
  plugins: [
    // Se você quiser usar o plugin de tipografia, instale com: npm install @tailwindcss/typography
    // require('@tailwindcss/typography'),
    
    // Plugin customizado para prose se não quiser instalar o @tailwindcss/typography
    function({ addUtilities, theme }) {
      const proseUtilities = {
        '.prose': {
          color: theme('colors.gray.700'),
          maxWidth: 'none',
          lineHeight: '1.7',
          fontSize: '16px',
          '& p': {
            marginTop: '1.25em',
            marginBottom: '1.25em',
          },
          '& h1': {
            fontSize: '2.25em',
            marginTop: '0',
            marginBottom: '0.8888889em',
            lineHeight: '1.1111111',
            fontWeight: '800',
            color: theme('colors.gray.900'),
          },
          '& h2': {
            fontSize: '1.875em',
            marginTop: '2em',
            marginBottom: '1em',
            lineHeight: '1.3333333',
            fontWeight: '700',
            color: theme('colors.gray.900'),
          },
          '& h3': {
            fontSize: '1.5em',
            marginTop: '1.6em',
            marginBottom: '0.6em',
            lineHeight: '1.6',
            fontWeight: '600',
            color: theme('colors.gray.900'),
          },
          '& h4': {
            marginTop: '1.5em',
            marginBottom: '0.5em',
            lineHeight: '1.5',
            fontWeight: '600',
            color: theme('colors.gray.900'),
          },
          '& blockquote': {
            fontWeight: '500',
            fontStyle: 'italic',
            color: theme('colors.gray.900'),
            borderLeftWidth: '0.25rem',
            borderLeftColor: theme('colors.primary.500'),
            marginTop: '1.6em',
            marginBottom: '1.6em',
            paddingLeft: '1em',
          },
          '& ul': {
            listStyleType: 'disc',
            paddingLeft: '1.625em',
          },
          '& ol': {
            listStyleType: 'decimal',
            paddingLeft: '1.625em',
          },
          '& li': {
            paddingLeft: '0.375em',
            marginTop: '0.5em',
            marginBottom: '0.5em',
          },
          '& a': {
            color: theme('colors.primary.600'),
            textDecoration: 'underline',
            fontWeight: '500',
            '&:hover': {
              color: theme('colors.primary.700'),
            },
          },
          '& strong': {
            color: theme('colors.gray.900'),
            fontWeight: '600',
          },
          '& code': {
            color: theme('colors.gray.900'),
            backgroundColor: theme('colors.gray.100'),
            paddingLeft: '4px',
            paddingRight: '4px',
            paddingTop: '2px',
            paddingBottom: '2px',
            borderRadius: '0.375rem',
            fontSize: '0.875em',
            fontWeight: '600',
          },
          '& pre': {
            color: theme('colors.gray.200'),
            backgroundColor: theme('colors.gray.800'),
            overflowX: 'auto',
            fontSize: '0.875em',
            lineHeight: '1.7142857',
            marginTop: '1.7142857em',
            marginBottom: '1.7142857em',
            borderRadius: '0.375rem',
            padding: '0.8571429em 1.1428571em',
          },
          '& pre code': {
            backgroundColor: 'transparent',
            borderWidth: '0',
            borderRadius: '0',
            padding: '0',
            fontWeight: '400',
            color: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            lineHeight: 'inherit',
          },
          '& table': {
            width: '100%',
            tableLayout: 'auto',
            textAlign: 'left',
            marginTop: '2em',
            marginBottom: '2em',
            fontSize: '0.875em',
            lineHeight: '1.7142857',
          },
          '& thead': {
            borderBottomWidth: '1px',
            borderBottomColor: theme('colors.gray.300'),
          },
          '& thead th': {
            color: theme('colors.gray.900'),
            fontWeight: '600',
            verticalAlign: 'bottom',
            padding: '0.5714286em',
          },
          '& tbody tr': {
            borderBottomWidth: '1px',
            borderBottomColor: theme('colors.gray.200'),
          },
          '& tbody td': {
            verticalAlign: 'top',
            padding: '0.5714286em',
          },
        },
        '.prose-sm': {
          fontSize: '14px',
          lineHeight: '1.6',
        },
        '.prose-lg': {
          fontSize: '18px',
          lineHeight: '1.8',
        },
        '.prose-xl': {
          fontSize: '20px',
          lineHeight: '1.8',
        },
      };
      
      addUtilities(proseUtilities);
    },
  ],
}