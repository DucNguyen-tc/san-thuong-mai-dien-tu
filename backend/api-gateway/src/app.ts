import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalLimiter } from './middlewares/rateLimit.middleware';
import routes from './routes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
// Rate Limiting
app.use(globalLimiter);

// Logging
app.use(morgan('dev'));

// Note: express.json() is NOT applied globally here because http-proxy-middleware 
// needs to stream the raw body to the target service. If we parse it here, 
// the proxy might hang on POST/PUT requests. 
// Downstream services should have their own body parsers.

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API Gateway is running' });
});

// Register all proxy routes
app.use('/api', routes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Gateway Error]', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Gateway Error'
  });
});

export default app;
