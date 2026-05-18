const { Router } = require('express');
const { 
    getAllProducts, 
    getProductById, 
    getProductMeta,
    createProduct,
    updateProduct,
    deleteProduct
} = require('./product.controller');
const { getShippingCompanies } = require('./shipping-companies');
const { authMiddleware, authorize } = require('../../middlewares/auth.middleware');

const router = Router();

// Public Routes
router.get('/shipping-companies', getShippingCompanies);
router.get('/', getAllProducts);
router.get('/filters', getProductMeta); 
router.get('/:id', getProductById);

// (Merchant routes moved to merchant.product.routes.js)

module.exports = router;
