const { Router } = require('express');
const { getAllOrders } = require('./admin.order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate('admin'), getAllOrders);

module.exports = router;
