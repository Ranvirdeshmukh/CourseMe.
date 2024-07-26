const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Proxy setup
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});