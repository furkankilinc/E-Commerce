const { Router } = require('express');
const { getAllUsers, getAllMerchants } = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/users', authenticate('admin'), getAllUsers);
router.get('/merchants', authenticate('admin'), getAllMerchants);

module.exports = router;
