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
          700: "#CBD5E1", // light gray border hover / decorative icon color
          600: "#94A3B8", // light gray placeholder / disabled text
          500: "#64748B",
          450: "#64748B",
          400: "#64748B", // muted slate text
          350: "#334155",
          300: "#334155", // body text
          200: "#1E293B", // header text
          100: "#0F172A", // bold text
        },
        emerald: {
          950: "#E8F5E9", // light green background
          900: "#C8E6C9",
          800: "#A5D6A7",
          700: "#059669", // dark green for text/borders
          600: "#10B981", // primary accent/success
          500: "#10B981",
          400: "#059669", // dark green for text contrast
          300: "#81C784",
          200: "#A5D6A7",
          100: "#E8F5E9",
        },
        amber: {
          950: "#FEF3C7", // light yellow bg
          900: "#FDE68A",
          800: "#FCD34D",
          700: "#B45309", // dark amber for text/borders
          600: "#F59E0B", // primary warning
          500: "#F59E0B",
          400: "#D97706", // dark amber for text contrast
          300: "#FCD34D",
          200: "#FDE68A",
          100: "#FEF3C7",
        },
        rose: {
          950: "#FFE4E6", // light rose bg
          900: "#FECDD3",
          800: "#FDA4AF",
          700: "#BE123C", // dark rose text
          600: "#EF4444", // danger red
          500: "#EF4444",
          400: "#E11D48", // dark rose text contrast
          300: "#FDA4AF",
          200: "#FECDD3",
          100: "#FFE4E6",
        },
        cyan: {
          950: "#ECFEFF", // light cyan bg
          900: "#CFFAFE",
          800: "#A5F3FC",
          700: "#0369A1", // dark cyan text
          600: "#0EA5E9", // sky blue/cyan
          500: "#0EA5E9",
          400: "#0284C7", // dark cyan text contrast
          300: "#A5F3FC",
          200: "#CFFAFE",
          100: "#ECFEFF",
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
