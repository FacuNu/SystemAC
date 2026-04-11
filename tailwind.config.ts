import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contracts/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
          ink: "rgb(var(--surface-ink) / <alpha-value>)",
          accent: "rgb(var(--surface-accent) / <alpha-value>)",
          danger: "rgb(var(--surface-danger) / <alpha-value>)",
          line: "rgb(var(--surface-line) / <alpha-value>)"
        }
      },
      boxShadow: {
        panel: "0 24px 80px -32px rgba(15, 23, 42, 0.35)"
      },
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"]
      }
    }
  },
  plugins: []
};

export default config;
