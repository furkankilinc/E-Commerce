const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());
app.use(cookieParser());

// Order & Cart Routes
const orderRoutes = require('./src/api/orders/order.routes');
const cartRoutes = require('./src/api/orders/cart.routes');
const adminRoutes = require('./src/api/orders/admin.routes');
const { getWishlist, updateWishlist } = require('./src/api/orders/wishlist.controller');
const { getCollections, createCollection } = require('./src/api/orders/collections.controller');

app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', (req, res, next) => {
    const { Router } = require('express');
    const r = Router();
    r.get('/', getWishlist);
    r.post('/', updateWishlist);
    r(req, res, next);
});
app.use('/api/collections', (req, res, next) => {
    const { Router } = require('express');
    const r = Router();
    r.get('/', getCollections);
    r.post('/', createCollection);
    r(req, res, next);
});
app.use('/api/admin/orders', adminRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Order Service', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`✅ Order Service is running on port ${PORT}`);
});
