import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import cron from 'node-cron';
import { config } from '@jobpilot/config';
import { prisma } from '@jobpilot/database';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes';
import { syncAllJobSources } from './services/jobSyncService';

// Initialize Express app
const app = express();

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: false,
  })
);
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true, // required so the browser sends/receives the auth cookie
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check endpoint (also verifies DB connectivity)
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      database: 'unreachable',
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron] Starting scheduled job sync');

  try {
    const result = await syncAllJobSources();
    console.log('[Cron] Scheduled job sync completed', result);
  } catch (error) {
    console.error('[Cron] Scheduled job sync failed', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('[Cron] Educarriere sync scheduled every 6 hours');
});

export default app;
