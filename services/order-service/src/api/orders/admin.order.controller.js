const prisma = require('../../config/prisma');

const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const skip = (parsedPage - 1) * parsedLimit;

        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parsedLimit
            }),
            prisma.order.count({ where })
        ]);

        const pages = Math.ceil(total / parsedLimit);

        return res.status(200).json({ 
            success: true, 
            orders, 
            pages,
            pagination: {
                total,
                page: parsedPage,
                pages,
                limit: parsedLimit
            }
        });
    } catch (err) {
        console.error(err);
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
