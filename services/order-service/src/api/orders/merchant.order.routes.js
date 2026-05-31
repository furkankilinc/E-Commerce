const { Router } = require('express');
const { getMerchantOrders, getMerchantOrderById, updateOrderStatus } = require('./merchant.order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate('merchant'), getMerchantOrders);
router.get('/:id', authenticate('merchant'), getMerchantOrderById);
router.patch('/:id/status', authenticate('merchant'), updateOrderStatus);

module.exports = router;
