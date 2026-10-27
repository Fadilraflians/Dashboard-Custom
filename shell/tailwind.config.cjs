/** @type {import('tailwindcss').Config} */
module.exports = {
  // Prefix every class with `tw-` so shell utilities never collide with the
  // mounted MFEs (which also use Tailwind with the same `tw-` prefix but their
  // own bundled stylesheet).
  prefix: "tw-",
  // Dark mode driven by the shell's existing `[data-theme="dark"]` on <html>.
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--sc-border))",
        background: "hsl(var(--sc-background))",
        foreground: "hsl(var(--sc-foreground))",
        card: {
          DEFAULT: "hsl(var(--sc-card))",
          foreground: "hsl(var(--sc-card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--sc-primary))",
          foreground: "hsl(var(--sc-primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--sc-muted))",
          foreground: "hsl(var(--sc-muted-foreground))",
        },
        success: "hsl(var(--sc-success))",
        warning: "hsl(var(--sc-warning))",
        danger: "hsl(var(--sc-danger))",
      },
      borderRadius: {
        lg: "var(--sc-radius)",
        md: "calc(var(--sc-radius) - 2px)",
        sm: "calc(var(--sc-radius) - 4px)",
      },
    },
  },
  plugins: [],
};
