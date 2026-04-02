const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('./order.admin.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Protect all admin order routes by requiring an ADMIN audience token
router.use((req, res, next) => verifyToken(req, res, next, 'admin'));

router.get('/', getAllOrders);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
