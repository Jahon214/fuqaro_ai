/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
          soft: "var(--soft)"
        },
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        bg: "var(--bg)",
        ok: {
          DEFAULT: "var(--ok)",
          bg: "var(--ok-bg)"
        },
        warn: {
          DEFAULT: "var(--warn)",
          bg: "var(--warn-bg)"
        },
        crit: {
          DEFAULT: "var(--crit)",
          bg: "var(--crit-bg)"
        }
      },
      fontFamily: {
        body: ["Onest", "system-ui", "-apple-system", "sans-serif"],
        display: ["Literata", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};
