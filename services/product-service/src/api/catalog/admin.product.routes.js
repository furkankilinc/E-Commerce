const { Router } = require('express');
const { getAllProducts, updateProductStatus } = require('./product.controller');
const { createShippingCompany, deleteShippingCompany, updateShippingCompany } = require('./shipping-companies');
const { 
    getAllSupportSessions, 
    closeSupportSession, 
    sendSupportMessage,
    markReadByAdmin,
    blockUser,
    unblockUser,
    getBlockedUsersList,
    deleteSupportSession
} = require('./messaging.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate('admin'), getAllProducts);
router.patch('/:id/status', authenticate('admin'), updateProductStatus);

// Shipping Company CRUD
router.post('/shipping-companies', authenticate('admin'), createShippingCompany);
router.put('/shipping-companies/:id', authenticate('admin'), updateShippingCompany);
router.delete('/shipping-companies/:id', authenticate('admin'), deleteShippingCompany);

// Admin Support Chat Routes
router.get('/support/sessions', authenticate('admin'), getAllSupportSessions);
router.put('/support/sessions/:id/close', authenticate('admin'), closeSupportSession);
router.post('/support/sessions/:id/messages', authenticate('admin'), sendSupportMessage);
router.put('/support/sessions/:id/read-admin', authenticate('admin'), markReadByAdmin);
router.delete('/support/sessions/:id', authenticate('admin'), deleteSupportSession);
router.post('/support/sessions/block', authenticate('admin'), blockUser);
router.post('/support/sessions/unblock', authenticate('admin'), unblockUser);
router.get('/support/sessions/blocked', authenticate('admin'), getBlockedUsersList);

module.exports = router;
