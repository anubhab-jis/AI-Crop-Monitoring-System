/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Emerald/earthy primary ramp
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b', 950: '#022c22',
        },
        // Earthy accent (warm clay)
        clay: {
          50: '#fdf6ee', 100: '#f9e6d0', 200: '#f0caa0', 300: '#e4a866',
          400: '#d98a3c', 500: '#c9701f', 600: '#a85917', 700: '#874616',
          800: '#6e3a18', 900: '#5b3118',
        },
        // Slate text
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d4d9e1', 300: '#aeb6c4',
          400: '#828da0', 500: '#636c7e', 600: '#4d5566', 700: '#3e4452',
          800: '#272c36', 900: '#1a1e26', 950: '#0f1218',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,18,24,0.04), 0 4px 16px rgba(15,18,24,0.06)',
        'card-hover': '0 2px 4px rgba(15,18,24,0.06), 0 12px 32px rgba(15,18,24,0.10)',
        glow: '0 0 0 1px rgba(16,185,129,0.20), 0 8px 30px rgba(16,185,129,0.18)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-fast': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'pulse-ring': { '0%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.5)' }, '70%': { boxShadow: '0 0 0 8px rgba(16,185,129,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0)' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in-fast': 'fade-in-fast 0.3s ease both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-ring': 'pulse-ring 2s infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
