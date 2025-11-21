/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["react", "react-dom"]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "pbxt.replicate.delivery" },
      { protocol: "https", hostname: "i.imgur.com" }
    ]
  }
};

export default nextConfig;

