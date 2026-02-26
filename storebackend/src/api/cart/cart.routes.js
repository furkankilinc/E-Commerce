const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');

router.get('/', cartController.getCart);
router.post('/', cartController.saveCart);
router.get('/stats/:productId', cartController.getProductCartCount);

module.exports = router;
