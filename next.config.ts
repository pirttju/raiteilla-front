/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // If you end up using external images for flags or operator logos:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raiteilla.fi',
      },
    ],
  },
};

export default nextConfig;