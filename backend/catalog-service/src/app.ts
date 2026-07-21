import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Routes
// Mount tại /api/catalog (không phải /api) để FE gọi cùng 1 path tương đối
// '/catalog/...' dù đang gọi thẳng vào service này lúc dev (baseURL trỏ
// thẳng localhost:3002/api) hay gọi qua API Gateway sau này (baseURL trỏ
// localhost:3000/api, Gateway forward nguyên path xuống service).
app.use('/api/catalog', routes);

// Error handler — PHẢI đăng ký sau cùng, sau toàn bộ route
app.use(errorHandler);

export default app;
