const { Router } = require('express');
const { 
    getAllProducts, 
    getProductById, 
    getProductMeta,
    createProduct,
    updateProduct,
    deleteProduct
} = require('./product.controller');
const { authMiddleware, authorize } = require('../../middlewares/auth.middleware');

const router = Router();

// Public Routes
router.get('/', getAllProducts);
router.get('/filters', getProductMeta); 
router.get('/:id', getProductById);

// Merchant Specific Product List (Filtered by their ID)
router.get('/merchant/products', authMiddleware, authorize('MERCHANT', 'ADMIN'), getAllProducts);

// Merchant CRUD
router.post('/merchant/products', authMiddleware, authorize('MERCHANT'), createProduct);
router.put('/merchant/products/:id', authMiddleware, authorize('MERCHANT'), updateProduct);
router.delete('/merchant/products/:id', authMiddleware, authorize('MERCHANT'), deleteProduct);

module.exports = router;
