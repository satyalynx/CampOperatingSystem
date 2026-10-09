/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        canvas: "#F8FAFC",       // Main Light SaaS background
        surface: "#FFFFFF",      // Header, cards, drawers, modals
        "brand-orange": "#FF5733", // SpaceBasic Vibrant Coral CTA
        "brand-orange-hover": "#E0482B",
        "brand-orange-light": "#FF6B4A",
        "brand-blue": "#2563EB",   // Primary link / trust accent
        "text-main": "#0F172A",    // Crisp dark slate text
        "text-muted": "#64748B",   // Secondary text
        "border-light": "#E2E8F0", // Subtle border
        campus: {
          navy: "#0F172A",
          brand: "#2563EB",
          coral: "#FF5733",
          "coral-hover": "#E0482B",
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          border: "#E2E8F0",
          muted: "#64748B",
        },
        sla: {
          critical: "#EF4444",
          warning: "#F59E0B",
          success: "#10B981",
          info: "#3B82F6",
        }
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'soft-md': '0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'soft-lg': '0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'glow-coral': '0 0 16px -2px rgba(255, 87, 51, 0.25)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-left': 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
