const { Router } = require('express');
const { createOrder, getUserOrders, getOrderById } = require('./order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.post('/', authenticate('user'), createOrder);
router.get('/my-orders', authenticate('user'), getUserOrders);
router.get('/:id', authenticate('user'), getOrderById);

module.exports = router;
