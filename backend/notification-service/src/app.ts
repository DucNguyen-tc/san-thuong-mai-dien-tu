import express from 'express';
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import notificationTemplateRoutes from './routes/notification-template.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middlewares/errorHandler';

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Import and use routes here
app.use('/api/notification-templates', notificationTemplateRoutes);
app.use('/api/notifications', notificationRoutes);

// Bắt lỗi tập trung (phải để cuối cùng)
app.use(errorHandler);

export default app;
