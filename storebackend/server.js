const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── Auth Routes ─────────────────────────────────────────────────────────────
// Her entity tipi için ayrı prefix — tokenlar birbirinin endpoint'lerinde çalışmaz.
const userAuthRoutes = require('./src/api/auth/user.auth.routes');
const merchantAuthRoutes = require('./src/api/auth/merchant.auth.routes');
const adminAuthRoutes = require('./src/api/auth/admin.auth.routes');
const productRoutes = require('./src/api/product/product.routes');
const categoryRoutes = require('./src/api/product/category.routes');

app.use('/api/auth/user', userAuthRoutes);
app.use('/api/auth/merchant', merchantAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/user', require('./src/api/user/user.routes'));
app.use('/api/products', productRoutes);
app.use('/api/products-meta', require('./src/api/product/filter.routes'));
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', require('./src/api/cart/cart.routes'));

const merchantProductRoutes = require('./src/api/merchant/merchant.product.routes');
app.use('/api/merchant/products', merchantProductRoutes);


// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Fuira E-Commerce API is running 🚀' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
