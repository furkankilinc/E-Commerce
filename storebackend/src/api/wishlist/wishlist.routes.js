const { Router } = require('express');
const redis = require('../../config/redis');

const router = Router();

// GET /api/wishlist — Get wishlist items by wishlist ID (from header)
router.get('/', async (req, res) => {
    try {
        const wishlistId = req.headers['x-wishlist-id'] || 'guest';
        const data = await redis.get(`wishlist:${wishlistId}`);
        res.json(data ? JSON.parse(data) : []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
    }
});

// POST /api/wishlist — Save entire wishlist
router.post('/', async (req, res) => {
    try {
        const wishlistId = req.headers['x-wishlist-id'] || 'guest';
        const { items } = req.body;
        await redis.set(`wishlist:${wishlistId}`, JSON.stringify(items), 'EX', 60 * 60 * 24 * 30); // 30 days
        res.json({ message: 'Wishlist saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving wishlist', error: error.message });
    }
});

// DELETE /api/wishlist/:productId — Remove a specific product
router.delete('/:productId', async (req, res) => {
    try {
        const wishlistId = req.headers['x-wishlist-id'] || 'guest';
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
