module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,svg,webmanifest,json}'
  ],
  swDest: 'dist/service-worker.js',
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'retatrutide-runtime',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: ({ url }) => url.origin !== self.location.origin,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'retatrutide-external'
      }
    }
  ]
};