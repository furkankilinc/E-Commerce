const { Router } = require('express');
const { 
    getAllProducts, 
    getProductById,
    createProduct, 
    updateProduct, 
    deleteProduct,
    bulkUpdateStock
} = require('./product.controller');
const { authMiddleware, authorize } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authMiddleware, authorize('merchant', 'admin'), getAllProducts);
router.patch('/bulk-stock', authMiddleware, authorize('merchant'), bulkUpdateStock);
router.get('/:id', authMiddleware, authorize('merchant', 'admin'), getProductById);
router.post('/', authMiddleware, authorize('merchant'), createProduct);
router.put('/:id', authMiddleware, authorize('merchant'), updateProduct);
router.delete('/:id', authMiddleware, authorize('merchant'), deleteProduct);

module.exports = router;
