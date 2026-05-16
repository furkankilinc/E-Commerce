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
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV !== 'production' || ALLOWED_ORIGINS.includes(origin)) {
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
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' },
  });
  app.use('/api', generalLimiter);
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
const attributeRoutes = require('./src/api/product/attribute.routes');

app.use('/api/auth/user', userAuthRoutes);
app.use('/api/auth/merchant', merchantAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/user', require('./src/api/user/user.routes'));
app.use('/api/products', productRoutes);
app.use('/api/products-meta', require('./src/api/product/filter.routes'));
app.use('/api/categories', categoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/cart', require('./src/api/cart/cart.routes'));
app.use('/api/upload', uploadRoutes);
app.use('/api/wishlist', require('./src/api/wishlist/wishlist.routes'));
app.use('/api/collections', require('./src/api/collections/collections.routes'));
app.use('/api/orders', require('./src/api/order/order.routes'));
app.use('/api/reviews', require('./src/api/review/review.routes'));

const merchantProductRoutes = require('./src/api/merchant/merchant.product.routes');
const merchantOrderRoutes = require('./src/api/merchant/merchant.order.routes');
const merchantAdminRoutes = require('./src/api/admin/merchant.admin.routes');
const statsAdminRoutes = require('./src/api/admin/stats.admin.routes');
const orderAdminRoutes = require('./src/api/admin/order.admin.routes');

const productAdminRoutes = require('./src/api/admin/product.admin.routes');
const userAdminRoutes = require('./src/api/admin/user.admin.routes');

app.use('/api/merchant/products', merchantProductRoutes);
app.use('/api/merchant/orders', merchantOrderRoutes);
app.use('/api/merchant/stats', require('./src/api/merchant/merchant.stats.routes'));
app.use('/api/admin/merchants', merchantAdminRoutes);
app.use('/api/admin/stats', statsAdminRoutes);
app.use('/api/admin/orders', orderAdminRoutes);
app.use('/api/admin/products', productAdminRoutes);
app.use('/api/admin/users', userAdminRoutes);

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Fuira E-Commerce API is running 🚀' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[GLOBAL_ERROR_HANDLER]', err);
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: 'Bu kaynaktan erişim izni yok.' });
  }
  logger.error('Yakalanmamış hata', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ success: false, message: err.message || 'Sunucu hatası.' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ Fuira Backend ${PORT} portunda çalışıyor [v1.0.1]`);
});
