import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import orgRoutes from './modules/organizations/organizations.routes';
import teamRoutes from './modules/team/team.routes';
import leadRoutes from './modules/leads/leads.routes';
import contactRoutes from './modules/contacts/contacts.routes';
import companyRoutes from './modules/companies/companies.routes';
import dealRoutes from './modules/deals/deals.routes';
import pipelineRoutes from './modules/pipelines/pipelines.routes';
import taskRoutes from './modules/tasks/tasks.routes';
import activityRoutes from './modules/activities/activities.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportRoutes from './modules/reports/reports.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import searchRoutes from './modules/search/search.routes';
import aiRoutes from './modules/ai/ai.routes';

export const createApp = () => {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // General rate limiting
  app.use(generalLimiter);

  // Health check endpoint
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ClientFlow API',
      version: '1.0.0',
    });
  });

  // API v1 Modules
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/organizations', orgRoutes);
  app.use('/api/v1/team', teamRoutes);
  app.use('/api/v1/leads', leadRoutes);
  app.use('/api/v1/contacts', contactRoutes);
  app.use('/api/v1/companies', companyRoutes);
  app.use('/api/v1/deals', dealRoutes);
  app.use('/api/v1/pipelines', pipelineRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/activities', activityRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/ai', aiRoutes);

  // 404 handler for undefined API routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
