const withPWA = require('next-pwa');

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // SPA Root - Cache First for instant offline loading
    {
      urlPattern: /^\/$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'spa-root',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    // API calls - Network First with offline fallback
    {
      urlPattern: /^https?.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Static assets (JS, CSS) - Stale While Revalidate
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Images - Cache First with long expiration
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        },
      },
    },
    // Fonts - Cache First with very long expiration
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    // Everything else - Network First with offline cache
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offline-fallback',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig = {
  // PRODUCTION READY: Enable type checking and linting for safety
  // Removed ignoreBuildErrors and ignoreDuringBuilds to catch issues early

  // Disable static optimization to avoid useSearchParams issues
  output: 'standalone',

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Security and PWA headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Webpack optimization for SPA
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize client-side bundle for PWA
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for stable caching
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};

module.exports = withPWAConfig(nextConfig);
