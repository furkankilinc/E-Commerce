const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/', authenticate('user'), cartController.getCart);
router.post('/', authenticate('user'), cartController.saveCart);
router.get('/stats/:productId', cartController.getProductCartCount);

module.exports = router;
