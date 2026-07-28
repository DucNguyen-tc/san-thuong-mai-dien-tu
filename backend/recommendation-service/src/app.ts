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

import recommendationRoutes from './routes/recommendation.routes';

// Import and use routes here
app.use('/api/recommendations', recommendationRoutes);

export default app;
