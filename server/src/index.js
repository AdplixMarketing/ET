import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import billingRoutes from './routes/billing.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import { webhook } from './controllers/billing.controller.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body (must be before express.json)
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), webhook);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded files from R2
import { getFromR2 } from './services/r2.service.js';

app.get('/uploads/:userId/:filename', async (req, res) => {
  try {
    const key = `${req.params.userId}/${req.params.filename}`;
    const data = await getFromR2(key);
    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeMap = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.pdf': 'application/pdf' };
    res.set('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(data);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoicesRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FlowFi server running on port ${PORT}`);
});
