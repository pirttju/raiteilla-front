import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Ensure these point to the src directory
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}", 
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