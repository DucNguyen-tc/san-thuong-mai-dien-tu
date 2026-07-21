import express from 'express';
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Import and use routes here
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

// Mount tại /api/cart để Gateway chỉ cần forward xuống (tương tự như catalog)
// Tuy nhiên ở cart-service hiện tại, routes/index.ts có thể đã bọc sẵn /cart
app.use('/api', routes);

// Error handler — PHẢI đăng ký sau cùng
app.use(errorHandler);

export default app;
