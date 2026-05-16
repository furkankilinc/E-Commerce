const { Router } = require('express');
const {
    getAllProducts,
    updateProductStatus,
    deleteProduct
} = require('./product.admin.controller');
const { authenticate, requireSuperAdmin } = require('../../middlewares/auth.middleware');

const router = Router();

// /api/admin/products
router.get('/', authenticate('admin'), getAllProducts);
router.patch('/:id/status', authenticate('admin'), requireSuperAdmin, updateProductStatus);
router.delete('/:id', authenticate('admin'), requireSuperAdmin, deleteProduct);

module.exports = router;
