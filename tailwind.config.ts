import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}", // Added lib just in case
  ],
  theme: {
    extend: {
      colors: {
        vr: {
          green: '#56a834',
          dark: '#1a1a1a',
        }
      },
    },
  },
  plugins: [],
};
export default config;