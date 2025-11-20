/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Note: v4 uses this specific package, not 'tailwindcss'
    "@tailwindcss/postcss": {},
  },
};

export default config;
