const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, cancelOrder, returnOrder } = require('./order.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Protect all order routes by requiring a USER audience token
router.use((req, res, next) => verifyToken(req, res, next, 'user'));

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:orderId', getOrderById);
router.post('/:orderId/cancel', cancelOrder);
router.post('/:orderId/return', returnOrder);

module.exports = router;
