const { Router } = require('express');
const prisma = require('../../config/prisma');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate('merchant'), async (req, res) => {
    try {
        const merchantId = req.user.sub;

        // Total products count
        const totalProducts = await prisma.product.count({
            where: { merchantId }
        });

        // Total stock (Sum of all products' stock)
        const productsList = await prisma.product.findMany({
            where: { merchantId },
            select: { stock: true }
        });
        const totalStock = productsList.reduce((sum, p) => sum + (p.stock || 0), 0);

        // Orders stats
        const orderItems = await prisma.orderItem.findMany({
            where: { merchantId },
            include: { order: true }
        });

        const activeOrderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED'];
        const activeOrdersIds = new Set(orderItems.filter(item => activeOrderStatuses.includes(item.order.status)).map(item => item.orderId));
        const activeOrders = activeOrdersIds.size;

        const totalRevenue = orderItems
            .filter(item => item.order.paymentStatus === 'PAID' || item.order.status === 'DELIVERED')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Merchant Rating
        const reviews = await prisma.review.findMany({
            where: { product: { merchantId } }
        });
        const averageRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;

        // Sales data (last 7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const daySales = orderItems
                .filter(item => {
                    const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
                    return itemDate === dateStr && item.order.status !== 'CANCELLED';
                })
                .reduce((sum, item) => sum + (item.price * item.quantity), 0);

            chartData.push({
                date: dateStr,
                day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                amount: daySales
            });
        }

        // Low stock alerts - Sorted by stock ASC
        const lowStockProducts = await prisma.product.findMany({
            where: {
                merchantId,
                stock: { lte: 10, gt: 0 }
            },
            orderBy: {
                stock: 'asc'
            },
            take: 5
        });

        res.json({
            stats: {
                totalRevenue: Math.round(totalRevenue),
                activeOrders,
                totalStock,
                averageRating: parseFloat(averageRating.toFixed(1))
            },
            chartData,
            lowStock: lowStockProducts.map(p => ({
                name: p.name,
                stock: p.stock,
                pct: Math.max(5, Math.min(100, Math.round((p.stock / 15) * 100))) 
            }))
        });

    } catch (err) {
        console.error('[merchant/stats]', err);
        res.status(500).json({ message: 'İstatistikler alınamadı.' });
    }
});

module.exports = router;
