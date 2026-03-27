import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        tablet: "768px",
        desktop: "1024px",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "monospace"],
      },
      colors: {
        brand: {
          primary: "#4f46e5",
          secondary: "#0f172a",
          accent: "#22d3ee",
        },
      },
    },
  },
  plugins: [],
};

export default config;
