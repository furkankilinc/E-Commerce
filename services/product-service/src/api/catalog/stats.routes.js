const { Router } = require('express');
const { getDashboardStats, getMapData } = require('./stats.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/dashboard', authenticate('admin'), getDashboardStats);
router.get('/map', authenticate('admin'), getMapData);

module.exports = router;
