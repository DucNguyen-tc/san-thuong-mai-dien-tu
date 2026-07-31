import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Payment Service is running' });
});

// Mount các routes tại /api
app.use('/api', routes);

// Error handler — PHẢI đăng ký sau cùng (AGENT.md mục 4.2)
app.use(errorHandler);

export default app;
