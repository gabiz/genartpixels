import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },

  // Improve WebSocket handling for development
  webpack: (config, { dev }) => {
    if (dev) {
      // Prevent WebSocket connection issues during auth redirects
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  
  // Experimental features for better development experience
  experimental: {
    // Improve hot reload stability
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default nextConfig;
