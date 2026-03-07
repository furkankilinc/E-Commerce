const { Router } = require('express');
const redis = require('../../config/redis');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

// GET /api/wishlist — Get wishlist items
router.get('/', authenticate('user'), async (req, res) => {
    try {
        const wishlistId = req.user.sub;
        const data = await redis.get(`wishlist:${wishlistId}`);
        res.json(data ? JSON.parse(data) : []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
    }
});

// POST /api/wishlist — Save entire wishlist
router.post('/', authenticate('user'), async (req, res) => {
    try {
        const wishlistId = req.user.sub;
        const { items } = req.body;
        await redis.set(`wishlist:${wishlistId}`, JSON.stringify(items), 'EX', 60 * 60 * 24 * 30); // 30 days
        res.json({ message: 'Wishlist saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving wishlist', error: error.message });
    }
});

// DELETE /api/wishlist/:productId — Remove a specific product
router.delete('/:productId', authenticate('user'), async (req, res) => {
    try {
        const wishlistId = req.user.sub;
        const { productId } = req.params;
        const data = await redis.get(`wishlist:${wishlistId}`);
        const items = data ? JSON.parse(data) : [];
        const updated = items.filter(item => item.id !== productId);
        await redis.set(`wishlist:${wishlistId}`, JSON.stringify(updated), 'EX', 60 * 60 * 24 * 30);
        res.json({ message: 'Item removed from wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
    }
});

module.exports = router;
