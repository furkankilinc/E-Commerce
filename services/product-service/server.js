const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cookieParser());

// Catalog Routes
const productRoutes = require('./src/api/catalog/product.routes');
const categoryRoutes = require('./src/api/catalog/category.routes');
const statsRoutes = require('./src/api/catalog/stats.routes');
const attributeRoutes = require('./src/api/catalog/attribute.routes');
const reviewRoutes = require('./src/api/catalog/review.routes');
const uploadRoutes = require('./src/api/catalog/upload.routes');

app.use('/api/products', productRoutes);
app.use('/api/products-meta', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/stats', statsRoutes);
app.use('/api/admin/products', require('./src/api/catalog/admin.product.routes'));
app.use('/api/merchant/products', require('./src/api/catalog/merchant.product.routes'));
app.use('/api/merchant/stats', require('./src/api/catalog/merchant.stats.routes'));

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Product Service', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`✅ Product Service is running on port ${PORT}`);
});
