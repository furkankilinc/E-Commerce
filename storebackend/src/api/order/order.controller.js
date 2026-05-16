const prisma = require('../../config/prisma');

const createOrder = async (req, res) => {
    try {
        const { shippingAddress, billingAddress, paymentMethod, items } = req.body;
        const userId = req.user.sub || req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Sepetiniz boş.' });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.email || !shippingAddress.phone) {
            return res.status(400).json({ success: false, message: 'Teslimat adresi bilgileri eksik.' });
        }

        // Calculate total amount and get merchant IDs for items
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id }
            });

            if (!product) {
                return res.status(404).json({ success: false, message: `Ürün bulunamadı: ${item.name}` });
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItemsData.push({
                productId: item.id,
                merchantId: product.merchantId,
                quantity: item.quantity,
                price: product.price,
                variantName: item.variantName || null,
                variantValue: item.variantValue || null,
            });
        }

        // Create Order and OrderItems in a transaction, and deduct stock
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const createdOrder = await tx.order.create({
                data: {
                    orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
                    userId,
                    status: 'PENDING',
                    totalAmount,
                    shippingAddress,
                    billingAddress: billingAddress || shippingAddress,
                    paymentStatus: 'PAID', // In simulation, we assume payment is successful
                    paymentMethod: paymentMethod || 'CREDIT_CARD',
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            // Deduct stock for each item
            for (const item of orderItemsData) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            return createdOrder;
        });

        res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('[ORDER/CREATE] error:', err);
        res.status(500).json({ success: false, message: 'Sipariş oluşturulurken bir hata oluştu.' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    images: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.order.count({ where: { userId } })
        ]);

        res.json({
            success: true,
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('[ORDER/LIST] error:', err);
        res.status(500).json({ success: false, message: 'Siparişler listelenirken bir hata oluştu.' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const { orderId } = req.params;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.userId !== userId) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

        if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
            return res.status(400).json({ success: false, message: 'Bu sipariş iptal edilemez (Kargoya verilmiş olabilir).' });
        }

        // Cancel order and restore stock
        const orderWithItems = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            });

            // Restore stock for each item
            for (const item of orderWithItems.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            }

            return updated;
        });

        await prisma.systemLog.create({
            data: {
                level: 'info',
                action: 'ORDER_CANCELLED',
                message: `User canceled order ${order.orderNumber}`,
                targetId: orderId,
                targetType: 'ORDER',
                userId: userId,
                userRole: 'USER'
            }
        });

        res.json({ success: true, message: 'Siparişiniz iptal edildi.', order: updatedOrder });
    } catch (err) {
        console.error('[ORDER/CANCEL] error:', err);
        res.status(500).json({ success: false, message: 'İptal işlemi sırasında hata oluştu.' });
    }
};

const returnOrder = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const { orderId } = req.params;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.userId !== userId) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

        if (order.status !== 'DELIVERED') {
            return res.status(400).json({ success: false, message: 'İade talebi sadece teslim edilen siparişler için oluşturulabilir.' });
        }

        // Normally we might add a RETURN_REQUESTED status, but we can repurpose paymentStatus or log it.
        // Let's set the status to 'REFUNDED' temporarily or update paymentStatus as a request.
        // Actually, let's keep status DELIVERED but set paymentStatus to 'RETURN_REQUESTED'.
        // Mark as return requested and restore stock
        const orderWithItems = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id: orderId },
                data: { paymentStatus: 'RETURN_REQUESTED', status: 'REFUNDED' }
            });

            // Restore stock for each item
            for (const item of orderWithItems.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            }

            return updated;
        });

        await prisma.systemLog.create({
            data: {
                level: 'info',
                action: 'ORDER_RETURN_REQUEST',
                message: `User requested return for order ${order.orderNumber}`,
                targetId: orderId,
                targetType: 'ORDER',
                userId: userId,
                userRole: 'USER'
            }
        });

        res.json({ success: true, message: 'İade talebiniz oluşturuldu ve mağazaya iletildi.', order: updatedOrder });
    } catch (err) {
        console.error('[ORDER/RETURN] error:', err);
        res.status(500).json({ success: false, message: 'İade talebi sırasında hata oluştu.' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const { orderId } = req.params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

        // Security: only the owner can see the order
        if (order.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Bu siparişi görmeye yetkiniz yok.' });
        }

        res.json({ success: true, order });
    } catch (err) {
        console.error('[ORDER/GET_BY_ID] error:', err);
        res.status(500).json({ success: false, message: 'Sipariş detayları alınırken hata oluştu.' });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    returnOrder
};
