import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Middlewares
app.use(cors());
// Note: Do not use body-parser for proxy requests as it can interfere with proxying

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Proxy routes
app.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/api/addresses', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/api/catalog', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
app.use('/api/cart', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
app.use('/api/order', createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true }));
app.use('/api/payment', createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));
app.use('/api/notification', createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true }));
app.use('/api/recommendation', createProxyMiddleware({ target: 'http://localhost:3007', changeOrigin: true }));

export default app;
