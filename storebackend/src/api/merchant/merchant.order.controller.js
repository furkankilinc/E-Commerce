const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');

/**
 * Get all orders for the authenticated merchant
 * Returns orders that contain at least one item from this merchant
 */
const getMerchantOrders = async (req, res) => {
    try {
        const merchantId = req.user.sub;
        const { status, page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Find order IDs that have items belonging to this merchant
        const orders = await prisma.order.findMany({
            where: {
                items: {
                    some: {
                        merchantId: merchantId
                    }
                },
                ...(status && { status })
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                items: {
                    where: {
                        merchantId: merchantId
                    },
                    include: {
                        product: {
                            select: {
                                name: true,
                                images: {
                                    where: { isMain: true },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: parseInt(limit)
        });

        const total = await prisma.order.count({
            where: {
                items: {
                    some: {
                        merchantId: merchantId
                    }
                },
                ...(status && { status })
            }
        });

        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        logger.error('[MERCHANT/ORDERS] Get orders error:', err);
        return res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
    }
};

/**
 * Get details of a single order for the merchant
 */
const getMerchantOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user.sub;

        const order = await prisma.order.findFirst({
            where: {
                id,
                items: {
                    some: {
                        merchantId: merchantId
                    }
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                items: {
                    where: {
                        merchantId: merchantId
                    },
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

        return res.status(200).json({ success: true, order });
    } catch (err) {
        logger.error('[MERCHANT/ORDERS] Get order by ID error:', err);
        return res.status(500).json({ success: false, message: 'Sipariş detayı alınamadı.' });
    }
};

/**
 * Update order status (Simplified for now - updates the whole order)
 */
const updateMerchantOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const merchantId = req.user.sub;

        // Verify the order contains merchant's items
        const order = await prisma.order.findFirst({
            where: {
                id,
                items: {
                    some: {
                        merchantId: merchantId
                    }
                }
            },
            include: {
                items: {
                    where: { merchantId }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı veya yetkiniz yok.' });
        }

        // Restore stock if transitioning to CANCELLED or REFUNDED from a non-cancelled/refunded state
        const shouldRestoreStock = (status === 'CANCELLED' || status === 'REFUNDED') &&
            order.status !== 'CANCELLED' && order.status !== 'REFUNDED';

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id },
                data: { status }
            });

            if (shouldRestoreStock) {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.quantity }
                        }
                    });
                }
            }

            return updated;
        });

        logger.info(`[MERCHANT/ORDERS] Order ${id} status updated to ${status} by merchant ${merchantId}`);

        return res.status(200).json({
            success: true,
            message: 'Sipariş durumu güncellendi.',
            order: updatedOrder
        });
    } catch (err) {
        logger.error('[MERCHANT/ORDERS] Update status error:', err);
        return res.status(500).json({ success: false, message: 'Sipariş durumu güncellenemedi.' });
    }
};

module.exports = {
    getMerchantOrders,
    getMerchantOrderById,
    updateMerchantOrderStatus
};
