import express from 'express';
import cors from 'cors';
import passport from './config/passport';
import authRoutes from './routes/auth.routes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Routes
app.use('/api/auth', authRoutes);

export default app;
