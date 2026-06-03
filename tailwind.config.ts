import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        background: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        primary: '#0EA5E9',
        accent: '#10B981',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: '#0F172A',
        muted: '#64748B',
        slate: {
          950: "#F8FAFC", // off white background
          900: "#FFFFFF", // white container cards
          850: "#F1F5F9", // hover color
          800: "#E2E8F0", // borders and dividers
          500: "#64748B",
          450: "#64748B",
          400: "#64748B", // muted slate text
          350: "#334155",
          300: "#334155", // body text
          200: "#1E293B", // header text
          100: "#0F172A", // bold text
        },
        indigo: {
          950: "#E0F2FE", // light sky blue background for glows
          900: "#BAE6FD",
          800: "#7DD3FC",
          700: "#38BDF8",
          600: "#0EA5E9", // primary sky blue CTA
          500: "#0EA5E9", // active sky blue
          400: "#0EA5E9", // primary sky blue
          300: "#7DD3FC",
          200: "#BAE6FD",
          100: "#E0F2FE",
          50: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};
export default config;
