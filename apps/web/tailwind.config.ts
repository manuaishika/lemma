import type { Config } from "tailwindcss";

// Lemma design system. Warm paper, quiet, reading-first. Values live in
// globals.css as CSS variables (light + dark); Tailwind just names them.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-warm": "var(--paper-warm)",
        "paper-raised": "var(--surface)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        "ink-ghost": "var(--ink-ghost)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-dark)",
        "accent-light": "var(--accent-light)",
        "accent-dark": "var(--accent-dark)",
        red: "var(--red)",
        amber: "var(--amber)",
        blue: "var(--blue)",
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        reading: "42rem",
      },
      transitionTimingFunction: {
        spring: "var(--spring)",
        smooth: "var(--ease)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
