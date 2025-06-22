/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta InterTravel Principal
        'intertravel-navy': '#121c2e',
        'intertravel-navy-light': '#1a2742',
        'intertravel-navy-dark': '#0a0f1a',
        'intertravel-gold': '#b38144',
        'intertravel-gold-light': '#d4a574',
        'intertravel-gold-dark': '#8a5f33',
        
        // Colores complementarios revolucionarios
        'accent-blue': '#4facfe',
        'accent-green': '#43e97b',
        'accent-coral': '#fa709a',
        'accent-purple': '#6c5ce7',
        'accent-cyan': '#00cec9',
        
        // Gradientes premium
        'premium': {
          'gold': '#eab308',
          'gold-light': '#fbbf24',
          'navy': '#1e3a8a',
          'navy-light': '#3b82f6',
        }
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'jakarta': ['Plus Jakarta Sans', 'sans-serif'],
        'grotesk': ['Space Grotesk', 'sans-serif'],
        'sans': ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
        'display': ['Plus Jakarta Sans', 'Montserrat', 'sans-serif'],
        'accent': ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0a0f1a 0%, #121c2e 50%, #1a2742 100%)',
        'hero-morning': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'hero-afternoon': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'hero-evening': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'hero-night': 'linear-gradient(135deg, #0a0f1a 0%, #121c2e 50%, #1a2742 100%)',
        
        'card-gradient': 'linear-gradient(135deg, rgba(179, 129, 68, 0.1) 0%, rgba(18, 28, 46, 0.1) 100%)',
        'button-gradient': 'linear-gradient(135deg, #b38144 0%, #d4a574 100%)',
        'button-premium': 'linear-gradient(135deg, #eab308 0%, #fbbf24 100%)',
        
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%)',
        
        'revolutionary-card': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 10s ease-in-out infinite',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.8s ease-out',
        'fade-in': 'fadeIn 1s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-urgency': 'pulseUrgency 2s ease-in-out infinite',
        'text-shimmer': 'textShimmer 3s ease-in-out infinite',
        'live-update': 'liveUpdate 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: '0.3' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)', opacity: '0.8' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: '0.3' },
          '50%': { transform: 'translateY(-30px) scale(1.1)', opacity: '0.6' },
        },
        slideUp: {
          '0%': { transform: 'translateY(50px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(179, 129, 68, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(179, 129, 68, 0.6)' },
        },
        pulseUrgency: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-2px) scale(1.05)' },
        },
        textShimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        liveUpdate: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      boxShadow: {
        'intertravel': '0 10px 40px rgba(18, 28, 46, 0.1)',
        'intertravel-hover': '0 20px 60px rgba(18, 28, 46, 0.2)',
        'gold-glow': '0 0 30px rgba(179, 129, 68, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-hover': '0 20px 40px rgba(0, 0, 0, 0.2)',
        'premium': '0 25px 50px rgba(0, 0, 0, 0.3)',
        'revolutionary': '0 30px 60px rgba(0, 0, 0, 0.15)',
        'urgency': '0 4px 15px rgba(239, 68, 68, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        'revolutionary': '25px',
        'premium': '20px',
      },
      perspective: {
        '1000': '1000px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.transform-style-3d': {
          transformStyle: 'preserve-3d',
        },
        '.backface-hidden': {
          backfaceVisibility: 'hidden',
        },
        '.glass-morphism': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-morphism-dark': {
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}
