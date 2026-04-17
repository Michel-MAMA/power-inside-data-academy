import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Backgrounds
        void: "#070809",
        carbon: "#0C0D0F",
        graphite: "#111316",
        slate: "#171A1E",
        // Accents
        blue: {
          DEFAULT: "#009BF9",
          dim: "rgba(0,155,249,0.12)",
          border: "rgba(0,155,249,0.35)",
        },
        emerald: {
          DEFAULT: "#00D68F",
          dim: "rgba(0,214,143,0.12)",
        },
        amber: {
          DEFAULT: "#FFAA00",
          dim: "rgba(255,170,0,0.12)",
        },
        purple: {
          DEFAULT: "#B464FF",
          dim: "rgba(180,100,255,0.12)",
        },
        // Text
        white: {
          DEFAULT: "#FFFFFF",
          85: "rgba(255,255,255,0.85)",
          60: "rgba(255,255,255,0.60)",
          35: "rgba(255,255,255,0.35)",
          12: "rgba(255,255,255,0.12)",
          6: "rgba(255,255,255,0.06)",
        },
        border: "rgba(255,255,255,0.07)",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "marquee": "marquee 30s linear infinite",
        "fade-up": "fade-up 0.5s ease forwards",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
