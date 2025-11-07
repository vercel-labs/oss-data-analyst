import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Turbopack configuration for Next.js 16 (development)
  turbopack: {
    // Empty config to explicitly enable Turbopack without warnings
  },
  
  // Webpack configuration (production builds)
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // Handle font files in server bundle
      config.module.rules.push({
        test: /\.(ttf|ttc|otf|woff|woff2)$/,
        type: "asset/resource",
        generator: {
          filename: "static/fonts/[name][ext]",
        },
      });

      // Handle native .node files (for packages like resvg-js)
      config.module.rules.push({
        test: /\.node$/,
        use: [
          {
            loader: "node-loader",
            options: {
              name: "[path][name].[ext]",
            },
          },
        ],
      });

      // Externalize native modules to prevent bundling issues
      if (!Array.isArray(config.externals)) {
        config.externals = [];
      }
      
      config.externals.push({
        "@resvg/resvg-js": "@resvg/resvg-js",
        "canvas": "canvas",
        "snowflake-sdk": "snowflake-sdk",
      });
    }

    // Fallback for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },

  // Next.js 16 specific settings
  experimental: {
    // Server actions (if you plan to use them)
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
