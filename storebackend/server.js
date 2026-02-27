const express = require('express');
const cors = require('cors');
require('dotenv').config();
const logger = require('./src/utils/logger');
const requestLogger = require('./src/middlewares/monitoring/requestLogger.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security: Helmet (HTTP Security Headers) ──────────────────────────────────
let helmet;
try { helmet = require('helmet'); } catch { helmet = null; }
if (helmet) app.use(helmet());

// ── Security: Cookie Parser ──────────────────────────────────────────────────
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// ── Security: CORS ─────────────────────────────────────────────────────────────
// Only allow requests from known frontend origins.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) or whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked]: ${origin}`);
      callback(new Error(`CORS: Origin "${origin}" not allowed.`));
    }
  },
  credentials: true,
}));

// ── Security: Body Size Limit ─────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Security: Data Sanitization (XSS Protection) ──────────────────────────────
const sanitize = require('./src/middlewares/validation/sanitize.middleware');
app.use(sanitize);

// ── Security: Rate Limiting ───────────────────────────────────────────────────
let rateLimit;
try { rateLimit = require('express-rate-limit'); } catch { rateLimit = null; }

if (rateLimit) {
  // General API: 1000 requests per 15 minutes per IP (Increased for development)
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' },
  });

  // Auth endpoints: max 10 attempts per 15 minutes per IP (brute force protection)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
    skipSuccessfulRequests: true, // Only count failed attempts
  });

  app.use('/api', generalLimiter);
  app.use('/api/auth/user/login', authLimiter);
  app.use('/api/auth/user/register', authLimiter);
  app.use('/api/auth/merchant/login', authLimiter);
  app.use('/api/auth/admin/login', authLimiter);
}

// ── Logging: HTTP İstek Kaydı ────────────────────────────────────────────────
app.use(requestLogger);

// ─── Auth Routes ─────────────────────────────────────────────────────────────
const userAuthRoutes = require('./src/api/auth/user.auth.routes');
const merchantAuthRoutes = require('./src/api/auth/merchant.auth.routes');
const adminAuthRoutes = require('./src/api/auth/admin.auth.routes');
const productRoutes = require('./src/api/product/product.routes');
const categoryRoutes = require('./src/api/product/category.routes');
const uploadRoutes = require('./src/api/upload/upload.routes');

app.use('/api/auth/user', userAuthRoutes);
app.use('/api/auth/merchant', merchantAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/user', require('./src/api/user/user.routes'));
app.use('/api/products', productRoutes);
app.use('/api/products-meta', require('./src/api/product/filter.routes'));
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', require('./src/api/cart/cart.routes'));
app.use('/api/upload', uploadRoutes);
app.use('/api/wishlist', require('./src/api/wishlist/wishlist.routes'));
app.use('/api/collections', require('./src/api/collections/collections.routes'));

const merchantProductRoutes = require('./src/api/merchant/merchant.product.routes');
app.use('/api/merchant/products', merchantProductRoutes);

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Fuira E-Commerce API is running 🚀' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: 'Bu kaynaktan erişim izni yok.' });
  }
  logger.error('Yakalanmamış hata', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ message: 'Sunucu hatası.' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ Fuira Backend ${PORT} portunda çalışıyor`);
});

