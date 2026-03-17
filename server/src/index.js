import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import billingRoutes from './routes/billing.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import dataRoutes from './routes/data.routes.js';
import usageRoutes from './routes/usage.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import connectRoutes from './routes/connect.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import portalRoutes from './routes/portal.routes.js';
import businessesRoutes from './routes/businesses.routes.js';
import automationRoutes from './routes/automation.routes.js';
import recurringRoutes from './routes/recurring.routes.js';
import importsRoutes from './routes/imports.routes.js';
import { webhook } from './controllers/billing.controller.js';
import errorHandler from './middleware/errorHandler.js';
import authenticate from './middleware/auth.js';
import { startInvoiceOverdueJob } from './jobs/invoiceOverdue.js';
import { startRecurringProcessor } from './jobs/recurringProcessor.js';
import { startInvoiceReminderJob } from './jobs/invoiceReminders.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (Railway/Vercel run behind a proxy)
app.set('trust proxy', 1);

// Stripe webhook needs raw body (must be before express.json)
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), webhook);

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

const ocrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many scans. Please wait a minute.' },
});

// Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174']
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(helmet());
app.use(generalLimiter);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

// Serve uploaded files from R2 (authenticated, user can only access own files)
import { getFromR2 } from './services/r2.service.js';

app.get('/uploads/:userId/:filename', authenticate, async (req, res) => {
  try {
    if (String(req.params.userId) !== String(req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const key = `${req.params.userId}/${req.params.filename}`;
    const data = await getFromR2(key);
    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeMap = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.pdf': 'application/pdf' };
    res.set('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(data);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ocr', ocrLimiter, ocrRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/imports', importsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AddFi server running on port ${PORT}`);
  startInvoiceOverdueJob();
  startRecurringProcessor();
  startInvoiceReminderJob();
});
