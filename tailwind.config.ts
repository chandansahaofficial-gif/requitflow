import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        foreground: "#FFFFFF",
        slate: {
          300: "#A8A3B8", // secondary text
          400: "#7C748E", // muted text
          500: "#4C1D95",
          600: "#2A2540",
          700: "#2A2540", // main border
          800: "#151326", // card background
          900: "#0F0D1A", // input background
          950: "#090814", // sidebar background
        },
        purple: {
          200: "#C084FC",
          300: "#C084FC", // soft purple
          400: "#A855F7", // bright purple
          500: "#7C3AED", // primary purple
          600: "#4C1D95", // dark purple
          700: "rgba(168, 85, 247, 0.22)", // purple border
          800: "#151326",
          900: "#0F0D1A",
        },
        blue: {
          400: "#22D3EE", // cyan
          500: "#2563EB", // blue accent
          600: "#1d4ed8",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#38BDF8",
      },
    },
  },
  plugins: [],
};
export default config;
