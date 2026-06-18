/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Segoe UI Variable Display", "Segoe UI", "sans-serif"],
        body: ["Segoe UI Variable Text", "Segoe UI", "sans-serif"],
        ui: ["Segoe UI Variable Text", "Segoe UI", "sans-serif"]
      },
      colors: {
        shell: {
          950: "#166534",
          900: "#1a7a42",
          800: "#1e9452"
        },
        canvas: {
          50: "#f8fafc",
          100: "#f0f7ec",
          200: "#eef7eb"
        },
        accent: {
          green: "#68be45",
          mint: "#7dd45a",
          forest: "#4a9630",
          teal: "#3a7f28",
          gold: "#d97706",
          plum: "#6366f1",
          danger: "#dc2626"
        }
      },
      boxShadow: {
        shell: "0 26px 52px rgba(18, 29, 24, 0.14)",
        card: "0 14px 32px rgba(18, 29, 24, 0.07)",
        soft: "0 8px 18px rgba(18, 29, 24, 0.05)"
      }
    }
  },
  plugins: []
};
