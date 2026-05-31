const { Router } = require('express');
const { getAllOrders, getOrderById, updateOrderStatus } = require('./admin.order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate('admin'), getAllOrders);
router.get('/:id', authenticate('admin'), getOrderById);
router.patch('/:id/status', authenticate('admin'), updateOrderStatus);

module.exports = router;
