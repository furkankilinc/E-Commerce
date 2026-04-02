const redis = require('../../config/redis');

const getCartId = (req) => {
    if (req.user && req.user.sub) {
        return `u:${req.user.sub}`;
    }
    const guestId = req.headers['x-cart-id'] || req.ip || 'guest';
    return `g:${guestId}`;
};

const getCart = async (req, res) => {
    try {
        const cartId = getCartId(req);
        const data = await redis.get(`cart:${cartId}`);
        res.json(data ? JSON.parse(data) : []);
    } catch (error) {
        console.error('[CART] Get error:', error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};

const saveCart = async (req, res) => {
    try {
        const cartId = getCartId(req);
        const { items } = req.body;

        const oldData = await redis.get(`cart:${cartId}`);
        const oldItems = oldData ? JSON.parse(oldData) : [];
        const oldProductIds = new Set(oldItems.map(item => item.id));
        const newProductIds = new Set(items.map(item => item.id));

        for (const id of oldProductIds) {
            if (!newProductIds.has(id)) {
                await redis.srem(`product_carts:${id}`, cartId);
            }
        }
        for (const id of newProductIds) {
            await redis.sadd(`product_carts:${id}`, cartId);
        }

        await redis.set(`cart:${cartId}`, JSON.stringify(items), 'EX', 60 * 60 * 24 * 7); // 1 week
        res.json({ success: true, message: 'Cart saved successfully' });
    } catch (error) {
        console.error('[CART] Save error:', error);
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
