const redis = require('../../config/redis');

// Cart data is stored with a key like 'cart:userId' or 'cart:sessionId'
// For now, we use a simple sessionId or token from headers
const getCart = async (req, res) => {
    try {
        const cartId = req.headers['x-cart-id'] || 'guest';
        const data = await redis.get(`cart:${cartId}`);
        res.json(data ? JSON.parse(data) : []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};

const saveCart = async (req, res) => {
    try {
        const cartId = req.headers['x-cart-id'] || 'guest';
        const { items } = req.body;
        await redis.set(`cart:${cartId}`, JSON.stringify(items), 'EX', 60 * 60 * 24 * 7); // 1 week expiry
        res.json({ message: 'Cart saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving cart', error: error.message });
    }
};

module.exports = {
    getCart,
    saveCart
};
