const redis = require('../../config/redis');

// Cart data is stored with a key like 'cart:userId' or 'cart:sessionId'
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

        // Get old cart to track changes
        const oldData = await redis.get(`cart:${cartId}`);
        const oldItems = oldData ? JSON.parse(oldData) : [];
        const oldProductIds = new Set(oldItems.map(item => item.id));
        const newProductIds = new Set(items.map(item => item.id));

        // Remove from products that are no longer in cart
        for (const id of oldProductIds) {
            if (!newProductIds.has(id)) {
                await redis.srem(`product_carts:${id}`, cartId);
            }
        }

        // Add to products that are in new cart
        for (const id of newProductIds) {
            await redis.sadd(`product_carts:${id}`, cartId);
        }

        await redis.set(`cart:${cartId}`, JSON.stringify(items), 'EX', 60 * 60 * 24 * 7); // 1 week expiry
        res.json({ message: 'Cart saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving cart', error: error.message });
    }
};

const getProductCartCount = async (req, res) => {
    try {
        const { productId } = req.params;
        const count = await redis.scard(`product_carts:${productId}`);
        res.json({ count: count || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product cart count', error: error.message });
    }
};

module.exports = {
    getCart,
    saveCart,
    getProductCartCount
};

