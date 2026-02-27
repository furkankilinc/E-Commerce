const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');

router.get('/', optionalAuthenticate('user'), cartController.getCart);
router.post('/', optionalAuthenticate('user'), cartController.saveCart);
router.get('/stats/:productId', cartController.getProductCartCount);

module.exports = router;
