const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');

router.get('/', cartController.getCart);
router.post('/', cartController.saveCart);

module.exports = router;
