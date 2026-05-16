const prisma = require('../../config/prisma');

const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const where = status ? { status } : {};

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    merchant: {
                                        select: {
                                            companyName: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            orders
        });
    } catch (err) {
        console.error('[ADMIN/ORDERS/LIST] error:', err);
        res.status(500).json({ success: false, message: 'Siparişler listelenirken bir hata oluştu.' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await prisma.order.update({
            where: { id },
            data: { status }
        });

        res.json({ success: true, order: updated });
    } catch (err) {
        console.error('[ADMIN/ORDERS/UPDATE] error:', err);
        res.status(500).json({ success: false, message: 'Sipariş durumu güncellenirken bir hata oluştu.' });
    }
};

module.exports = {
    getAllOrders,
    updateOrderStatus
};
