const { Router } = require('express');
const { canReview, createReview } = require('./review.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/can-review/:id', authenticate('user'), canReview);
router.post('/', authenticate('user'), createReview);

module.exports = router;
