import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        paper: "#f7f8fb",
        panel: "#ffffff",
        line: "#d8dee8",
        accent: "#2563eb",
        mint: "#0f766e",
        berry: "#9f1239"
      },
      boxShadow: {
        page: "0 12px 28px rgba(23, 32, 42, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
