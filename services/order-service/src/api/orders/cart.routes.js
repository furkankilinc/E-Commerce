const { Router } = require('express');
const { getCart, saveCart, getProductCartCount } = require('./cart.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate(null, true), getCart);
router.post('/', authenticate(null, true), saveCart);

router.get('/products/:productId/count', getProductCartCount);

module.exports = router;
