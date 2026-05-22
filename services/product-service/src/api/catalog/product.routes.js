const { Router } = require('express');
const { 
    getAllProducts, 
    getProductById, 
    getProductMeta,
    createProduct,
    updateProduct,
    deleteProduct
} = require('./product.controller');
const { getShippingCompanies } = require('./shipping-companies');
const { 
    startSupportSession, 
    sendSupportMessage, 
    getSupportMessages, 
    markReadByUser,
    askProductQuestion, 
    getProductQuestions 
} = require('./messaging.controller');
const { authMiddleware, authorize } = require('../../middlewares/auth.middleware');

const router = Router();

// Public Routes
router.get('/shipping-companies', getShippingCompanies);
router.get('/', getAllProducts);
router.get('/filters', getProductMeta); 
router.get('/:id', getProductById);

// Live Support Chat Routes
router.post('/support/sessions', startSupportSession);
router.post('/support/sessions/:id/messages', sendSupportMessage);
router.get('/support/sessions/:id/messages', getSupportMessages);
router.put('/support/sessions/:id/read-user', markReadByUser);

// Product Questions Routes
router.post('/:productId/questions', askProductQuestion);
router.get('/:productId/questions', getProductQuestions);

module.exports = router;
