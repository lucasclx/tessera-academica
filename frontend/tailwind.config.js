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
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
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
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            maxWidth: 'none',
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.700'),
              },
            },
            h1: {
              color: theme('colors.gray.900'),
            },
            h2: {
              color: theme('colors.gray.900'),
            },
            h3: {
              color: theme('colors.gray.900'),
            },
            h4: {
              color: theme('colors.gray.900'),
            },
            blockquote: {
              borderLeftColor: theme('colors.primary.200'),
              color: theme('colors.gray.700'),
            },
            code: {
              color: theme('colors.primary.600'),
              backgroundColor: theme('colors.gray.100'),
              paddingLeft: theme('spacing.1'),
              paddingRight: theme('spacing.1'),
              paddingTop: theme('spacing.0.5'),
              paddingBottom: theme('spacing.0.5'),
              borderRadius: theme('borderRadius.sm'),
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
  safelist: [
    // Status badges
    'status-badge',
    'status-draft',
    'status-submitted',
    'status-revision',
    'status-approved',
    'status-finalized',
    // Button variants
    'btn',
    'btn-primary',
    'btn-secondary',
    'btn-success',
    'btn-danger',
    'btn-sm',
    'btn-lg',
    // Navigation
    'nav-link',
    'nav-link-active',
    'nav-link-inactive',
    // Cards
    'card',
    'card-hover',
    // Form elements
    'input-field',
    'input-error',
    // Primary color variants
    {
      pattern: /bg-primary-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-primary-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /border-primary-(50|100|200|300|400|500|600|700|800|900)/,
    },
  ],
}