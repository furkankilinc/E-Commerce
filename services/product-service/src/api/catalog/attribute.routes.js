const { Router } = require('express');
const { getAllAttributes } = require('./attribute.controller');
const router = Router();

router.get('/', getAllAttributes);

module.exports = router;
