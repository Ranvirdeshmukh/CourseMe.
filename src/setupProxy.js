const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://oracle-www.dartmouth.edu',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // remove /api prefix when forwarding to the target
      },
    })
  );

  // Proxy for Google Cloud Storage to avoid CORS issues
  app.use(
    '/gcs',
    createProxyMiddleware({
      target: 'https://storage.googleapis.com',
      changeOrigin: true,
      pathRewrite: {
        '^/gcs': '', // remove /gcs prefix when forwarding to the target
      },
    })
  );
};