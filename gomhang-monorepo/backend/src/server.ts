import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';

// Load environment variables từ file .env trong backend folder
// Trên Vercel, environment variables được load tự động, không cần .env file
// Chỉ load .env file trong development/local environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '../../.env');
  dotenv.config({ path: envPath });
} else {
  // Trên Vercel, chỉ load .env nếu file tồn tại (for local testing)
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - Support Safari và các browser khác
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, Postman, hoặc Safari trong một số trường hợp)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow localhost trong development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    // Nếu là production (có origin từ Vercel), cho phép tất cả
    // Hoặc bạn có thể whitelist cụ thể các domain Vercel
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Tạm thời cho phép tất cả, có thể restrict sau
    }
  },
  credentials: true, // Cho phép gửi cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache headers for API responses
app.use((req, res, next) => {
  // Don't cache API responses by default (except GET requests to specific endpoints)
  if (req.method === 'GET' && (req.path === '/api/health' || req.path === '/api')) {
    res.set('Cache-Control', 'public, max-age=60'); // Cache health check for 1 minute
  } else {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Gom Hàng Pro API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      staff: '/api/staff',
      customers: '/api/customers',
      counters: '/api/counters',
      shifts: '/api/shifts',
      orders: '/api/orders'
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Gom Hàng Pro API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      staff: '/api/staff',
      customers: '/api/customers',
      counters: '/api/counters',
      shifts: '/api/shifts',
      orders: '/api/orders'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Gom Hàng Pro API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
import authRoutes from './routes/auth.routes.js';
import staffRoutes from './routes/staff.routes.js';
import customersRoutes from './routes/customers.routes.js';
import countersRoutes from './routes/counters.routes.js';
import shiftsRoutes from './routes/shifts.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import customerFeesRoutes from './routes/customer-fees.routes.js';
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/counters', countersRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customer-fees', customerFeesRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/staff',
      'GET /api/customers',
      'GET /api/counters',
      'GET /api/shifts',
      'GET /api/orders'
    ]
  });
});

// Export app for Vercel serverless function
export default app;

// Only start server if not in Vercel environment
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);

    // Test Supabase connection if credentials are provided
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { testSupabaseConnection } = await import('./config/supabase.js');
        await testSupabaseConnection();
      } catch (error: any) {
        console.log('⚠️  Supabase connection failed:', error?.message || error);
      }
    } else {
      console.log('⚠️  Supabase credentials not found');
    }
  });
}
