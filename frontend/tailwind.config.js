/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--fg-primary)",
        muted: "var(--fg-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        border: "var(--border)",
        card: "var(--bg-card)",
        surface: "var(--bg-secondary)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        soft: "var(--shadow)",
        strong: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
}
