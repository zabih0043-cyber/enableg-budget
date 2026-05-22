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
          950: "#173648",
          900: "#184052",
          800: "#1b5b43"
        },
        canvas: {
          50: "#f7faf8",
          100: "#f3f5f4",
          200: "#e8eeeb"
        },
        accent: {
          green: "#68be45",
          mint: "#87d462",
          forest: "#1c5f43",
          teal: "#247652",
          gold: "#f0b64c",
          plum: "#7a8edd",
          danger: "#d06c5c"
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
