const prisma = require('../../config/prisma');
const { publishToQueue } = require('../../utils/rabbitmq.util');

const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, totalAmount, userId } = req.body;
        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-${Date.now()}`,
                userId: userId,
                totalAmount,
                shippingAddress,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        merchantId: item.merchantId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });

        // --- ASYNC EVENT: Notify Product Service to decrease stock ---
        await publishToQueue('stock-update', {
            orderId: order.id,
            items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
        });

        return res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('[ORDER] Create error:', err);
        return res.status(500).json({ success: false, message: 'Sipariş oluşturulamadı.' });
    }
};

module.exports = { createOrder };
