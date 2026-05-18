const prisma = require('../../config/prisma');

const fetchProductDetails = async (productId) => {
    const urls = [
        process.env.PRODUCT_SERVICE_URL,
        'http://product-service:5002',
        'http://localhost:5002'
    ].filter(Boolean);

    for (const url of urls) {
        try {
            const response = await fetch(`${url}/api/products/${productId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            // Try next fallback URL
        }
    }
    return null;
};

const getMerchantOrders = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;
        const sort = req.query.sort;

        let where = {
            items: {
                some: { merchantId }
            }
        };

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } }
            ];
        }

        let orderBy = { createdAt: 'desc' };
        if (sort === 'oldest') {
            orderBy = { createdAt: 'asc' };
        } else if (sort === 'amount-asc') {
            orderBy = { totalAmount: 'asc' };
        } else if (sort === 'amount-desc') {
            orderBy = { totalAmount: 'desc' };
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        where: { merchantId }
                    }
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.order.count({ where })
        ]);

        const ordersWithProducts = await Promise.all(orders.map(async (order) => {
            const itemsWithProducts = await Promise.all(order.items.map(async (item) => {
                const product = await fetchProductDetails(item.productId);
                return {
                    ...item,
                    product: {
                        name: product?.name || 'Bilinmeyen Ürün',
                        images: product?.images || []
                    }
                };
            }));

            const sa = order.shippingAddress || {};
            const user = {
                name: sa.fullName || 'Bilinmeyen Müşteri',
                email: sa.email || 'E-posta Belirtilmedi',
                phone: sa.phone || 'Telefon Belirtilmedi'
            };

            return {
                ...order,
                user,
                items: itemsWithProducts
            };
        }));

        return res.status(200).json({ 
            success: true, 
            orders: ordersWithProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('[MERCHANT_ORDERS] Error:', err);
        return res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
    }
};

const getMerchantOrderById = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        const { id } = req.params;

        const order = await prisma.order.findFirst({
            where: {
                id,
                items: {
                    some: { merchantId }
                }
            },
            include: {
                items: {
                    where: { merchantId }
                }
            }
        });

        if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        
        const itemsWithProducts = await Promise.all(order.items.map(async (item) => {
            const product = await fetchProductDetails(item.productId);
            return {
                ...item,
                product: {
                    name: product?.name || 'Bilinmeyen Ürün',
                    images: product?.images || []
                }
            };
        }));

        const sa = order.shippingAddress || {};
        const orderWithProducts = {
            ...order,
            items: itemsWithProducts,
            user: {
                name: sa.fullName || 'Bilinmeyen Müşteri',
                email: sa.email || 'E-posta Belirtilmedi',
                phone: sa.phone || 'Telefon Belirtilmedi'
            }
        };

        return res.status(200).json({ success: true, order: orderWithProducts });
    } catch (err) {
        console.error('[MERCHANT_ORDER_BY_ID] Error:', err);
        return res.status(500).json({ success: false, message: 'Sipariş detayları alınamadı.' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        // Verify ownership
        const order = await prisma.order.findFirst({
            where: {
                id,
                items: {
                    some: { merchantId }
                }
            }
        });

        if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
        });

        return res.status(200).json({ success: true, order: updatedOrder });
    } catch (err) {
        console.error('[MERCHANT_ORDER_UPDATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Sipariş durumu güncellenemedi.' });
    }
};

module.exports = { getMerchantOrders, getMerchantOrderById, updateOrderStatus };
