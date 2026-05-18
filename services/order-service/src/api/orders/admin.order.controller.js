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

const getOrderById = async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });
        if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        return res.status(200).json({ success: true, order });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Sipariş alınamadı.' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status }
        });
        return res.status(200).json({ success: true, order });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Sipariş durumu güncellenemedi.' });
    }
};

module.exports = { getAllOrders, getOrderById, updateOrderStatus };
