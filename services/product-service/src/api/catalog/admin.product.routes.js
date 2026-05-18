const { Router } = require('express');
const { getAllProducts, updateProductStatus } = require('./product.controller');
const { createShippingCompany, deleteShippingCompany } = require('./shipping-companies');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate('admin'), getAllProducts);
router.patch('/:id/status', authenticate('admin'), updateProductStatus);

// Shipping Company CRUD
router.post('/shipping-companies', authenticate('admin'), createShippingCompany);
router.delete('/shipping-companies/:id', authenticate('admin'), deleteShippingCompany);

module.exports = router;
