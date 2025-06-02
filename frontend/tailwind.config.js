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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '1.6',
            p: {
              marginBottom: '1rem',
            },
            h1: {
              fontSize: '2rem',
              fontWeight: '700',
              lineHeight: '1.25',
              marginBottom: '1rem',
              color: '#111827',
            },
            h2: {
              fontSize: '1.5rem',
              fontWeight: '600',
              lineHeight: '1.25',
              marginBottom: '0.75rem',
              color: '#111827',
            },
            h3: {
              fontSize: '1.25rem',
              fontWeight: '600',
              lineHeight: '1.25',
              marginBottom: '0.75rem',
              color: '#111827',
            },
            blockquote: {
              borderLeft: '4px solid #e5e7eb',
              paddingLeft: '1rem',
              margin: '1rem 0',
              fontStyle: 'italic',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.375rem',
            },
            code: {
              backgroundColor: '#f3f4f6',
              color: '#ef4444',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
            },
            pre: {
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              margin: '1rem 0',
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
            },
            img: {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '0.5rem',
              margin: '1rem 0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            a: {
              color: '#2563eb',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(37, 99, 235, 0.3)',
              transition: 'text-decoration-color 0.15s ease-in-out',
              '&:hover': {
                textDecorationColor: '#2563eb',
              },
            },
            table: {
              borderCollapse: 'collapse',
              width: '100%',
              margin: '1rem 0',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              overflow: 'hidden',
            },
            'table th, table td': {
              border: '1px solid #e5e7eb',
              padding: '0.75rem',
              textAlign: 'left',
            },
            'table th': {
              backgroundColor: '#f9fafb',
              fontWeight: '600',
              color: '#374151',
            },
            'table tbody tr:nth-child(even)': {
              backgroundColor: '#f9fafb',
            },
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}