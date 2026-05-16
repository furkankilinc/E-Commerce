const { Router } = require('express');
const { createOrder } = require('./order.controller');

const router = Router();

router.post('/', createOrder);

module.exports = router;
