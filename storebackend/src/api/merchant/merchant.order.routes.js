const express = require('express');
const router = express.Router();
const controller = require('./merchant.order.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// In merchant routes, audience is 'merchant'
const requireMerchant = (req, res, next) => {
    return verifyToken(req, res, next, 'merchant');
};

router.get('/', requireMerchant, controller.getMerchantOrders);
router.get('/:id', requireMerchant, controller.getMerchantOrderById);
router.patch('/:id/status', requireMerchant, controller.updateMerchantOrderStatus);

module.exports = router;
