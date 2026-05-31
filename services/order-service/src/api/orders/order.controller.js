const prisma = require('../../config/prisma');
const { publishToQueue } = require('../../utils/rabbitmq.util');

const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Oturum açmalısınız.' });
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Sepet boş.' });

        let totalAmount = 0;

        const orderItemsWithMerchant = await Promise.all(items.map(async (item) => {
            const prodId = item.productId || item.id;
            let product = await fetchProductDetails(prodId);
            
            if (product && product.product) {
                product = product.product; // Just in case the format is { success: true, product }
            }
            
            if (!product || product.success === false || typeof product.price !== 'number') {
                throw new Error(`Gecersiz_Urun: ${prodId}`);
            }
            
            const actualPrice = product.discountPrice || product.price;
            totalAmount += (actualPrice * item.quantity);

            return {
                productId: prodId,
                merchantId: product.merchantId || product.merchant?.id || item.merchantId || null,
                quantity: item.quantity,
                price: actualPrice
            };
        }));

        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-${Date.now()}`,
                userId,
                totalAmount,
                shippingAddress,
                items: {
                    create: orderItemsWithMerchant
                }
            }
        });

        // RabbitMQ hataları siparişi engellememeli
        try {
            await publishToQueue('stock-update', {
                orderId: order.id,
                items: items.map(i => ({ productId: i.productId || i.id, quantity: i.quantity }))
            });
        } catch (mqErr) {
            console.error('[ORDER] RabbitMQ error (non-fatal):', mqErr);
        }

        return res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('[ORDER] Create error:', err);
        if (err.message && err.message.includes('Gecersiz_Urun')) {
            return res.status(400).json({ success: false, message: 'Sepetinizdeki bazı ürünlerin fiyatı güncellenmiş veya yayından kaldırılmış olabilir. Lütfen sepetinizi kontrol edin.' });
        }
        return res.status(500).json({ success: false, message: 'Sipariş oluşturulamadı.' });
    }
};

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

// ✅ Pagination + dynamically fetched product info
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Oturum açmalısınız.' });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    items: true
                }
            }),
            prisma.order.count({ where: { userId } })
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
            return {
                ...order,
                items: itemsWithProducts
            };
        }));

        return res.status(200).json({
            success: true,
            orders: ordersWithProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('[ORDER] GetUserOrders error:', err);
        return res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
    }
};

// ✅ Dynamically fetched product info
const getOrderById = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Oturum açmalısınız.' });

        const order = await prisma.order.findFirst({
            where: { id: req.params.id, userId },
            include: {
                items: true
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

        const orderWithProducts = {
            ...order,
            items: itemsWithProducts
        };

        return res.status(200).json({ success: true, order: orderWithProducts });
    } catch (err) {
        console.error('[ORDER] GetOrderById error:', err);
        return res.status(500).json({ success: false, message: 'Sipariş alınamadı.' });
    }
};

module.exports = { createOrder, getUserOrders, getOrderById };