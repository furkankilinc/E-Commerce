const prisma = require('../../config/prisma');

const getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ success: true, orders });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
    }
};

module.exports = { getAllOrders };
