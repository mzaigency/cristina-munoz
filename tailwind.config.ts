import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        salon: {
          pink: "hsl(var(--salon-pink))",
          "pink-light": "hsl(var(--salon-pink-light))",
          "pink-dark": "hsl(var(--salon-pink-dark))",
          gold: "hsl(var(--salon-gold))",
          "gold-light": "hsl(var(--salon-gold-light))",
          cream: "hsl(var(--salon-cream))",
        },
        // Stitch-imported surface scale (mapeado a hexes glowapp reales)
        "surface": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#F6F7FB",
        "surface-container": "#EEF0F7",
        "surface-container-high": "#E9ECF5",
        "surface-container-highest": "#E3E7F2",
        "surface-variant": "#E6E8F0",
        "on-surface": "#131520",
        "on-surface-variant": "#4A4D5C",
        "on-background": "#131520",
        "outline": "#676B7E",
        "outline-variant": "#C9CCD8",
        "primary-container": "#3358B0",
        // Stitch agenda tokens (no chocan con shadcn)
        "chip": "#F2F3F8",
        "ink-2": "#3A3D4A",
        "line": "rgba(230, 232, 240, 0.6)",
        success: { DEFAULT: "#16A249", soft: "#E7F6EC" },
        info: { DEFAULT: "#2E7FD4", soft: "#E6F0FB" },
        warning: { DEFAULT: "#F59E0B", soft: "#FEF3E0" },
      },
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
        'display': ['Plus Jakarta Sans', 'sans-serif'],
        'headline': ['Plus Jakarta Sans', 'sans-serif'],
        'body': ['Plus Jakarta Sans', 'sans-serif'],
        'label': ['Plus Jakarta Sans', 'sans-serif'],
        'serif': ['"Playfair Display"', 'Georgia', 'serif'],
        'poppins': ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-down": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.5)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "blur-in": {
          from: { opacity: "0", filter: "blur(10px)" },
          to: { opacity: "1", filter: "blur(0)" },
        },
        "marquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "fade-in-up": "fade-in-up 0.45s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "fade-in-down": "fade-in-down 0.45s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "fade-in-left": "fade-in-left 0.45s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "fade-in-right": "fade-in-right 0.45s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "slide-in-up": "slide-in-up 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        "slide-in-down": "slide-in-down 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        "slide-in-left": "slide-in-left 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
        "scale-out": "scale-out 0.15s cubic-bezier(0.23, 1, 0.32, 1)",
        "spin-slow": "spin-slow 20s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
        "glow": "glow 2s ease-in-out infinite",
        "wiggle": "wiggle 0.5s ease-in-out infinite",
        "blur-in": "blur-in 0.6s ease-out forwards",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        // Emil Kowalski easing curves — stronger than the built-in CSS easings
        "out": "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        "drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
        "brand": "cubic-bezier(0.3,0.9,0.3,1)",
      },
      boxShadow: {
        "ambient": "0px 20px 40px rgba(34,64,140,0.08)",
        "soft": "0 18px 50px -16px rgba(20,22,40,.14)",
        "fab": "0 8px 30px rgba(34,64,140,0.3)",
        "glow-sm": "0 0 10px hsl(var(--primary) / 0.2)",
        "glow": "0 0 20px hsl(var(--primary) / 0.3)",
        "glow-lg": "0 0 40px hsl(var(--primary) / 0.4)",
        "glow-accent": "0 0 20px hsl(var(--accent) / 0.3)",
        "elevated": "0 4px 6px -1px hsl(var(--foreground) / 0.1), 0 2px 4px -2px hsl(var(--foreground) / 0.1)",
        "elevated-lg": "0 10px 15px -3px hsl(var(--foreground) / 0.1), 0 4px 6px -4px hsl(var(--foreground) / 0.1)",
        "inner-glow": "inset 0 0 20px hsl(var(--primary) / 0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "shimmer": "linear-gradient(90deg, transparent, hsl(var(--background) / 0.5), transparent)",
        "brand-gradient": "linear-gradient(100deg, #22408C 0%, #98329A 100%)",
        "gradient-brand": "linear-gradient(100deg, #22408C 0%, #98329A 100%)",
        "hero-gradient": "linear-gradient(150deg, #1B2E5C 0%, #150E28 100%)",
        "striped-gray": "repeating-linear-gradient(45deg, #F2F3F8, #F2F3F8 10px, #FFFFFF 10px, #FFFFFF 20px)",
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config;