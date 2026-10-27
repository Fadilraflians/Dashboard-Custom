/** @type {import('tailwindcss').Config} */
module.exports = {
  // IMPORTANT (Module Federation): prefix every Tailwind class with `tw-` so
  // this remote's utilities never collide with the shell or other MFEs that
  // share the same document. e.g. `tw-flex`, `tw-p-4`.
  prefix: "tw-",
  // Dark mode driven by the shell's `[data-theme="dark"]` attribute on <html>
  // (one shared document across shell + all MFEs), so a single shell toggle
  // drives dark mode everywhere — shell, MFEs, and these shared cards.
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn-style semantic tokens mapped to CSS variables (defined in
        // tailwind.css). Values are HSL channel triplets so opacity utilities
        // (e.g. tw-bg-card/50) work.
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        success: "hsl(var(--success))",
        danger: "hsl(var(--danger))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
