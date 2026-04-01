const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');

/**
 * Get overall dashboard statistics
 */
const getDashboardStats = async (req, res) => {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const [
            totalMerchants,
            totalProducts,
            totalUsers,
            onlineUsersCount
        ] = await Promise.all([
            prisma.merchant.count(),
            prisma.product.count({ where: { status: 'PUBLISHED' } }),
            prisma.user.count(),
            prisma.user.count({
                where: {
                    lastActiveAt: {
                        gte: fifteenMinutesAgo
                    }
                }
            }),
            prisma.product.findMany({
                where: {
                    stock: { gt: 0, lte: 10 },
                    status: 'PUBLISHED'
                },
                orderBy: { stock: 'asc' },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    stock: true,
                    merchant: { select: { companyName: true } }
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalMerchants,
                totalProducts,
                totalUsers,
                onlineUsers: onlineUsersCount,
                lowStock
            }
        });
    } catch (err) {
        logger.error('[ADMIN/STATS] Get stats error:', err);
        return res.status(500).json({ success: false, message: 'İstatistikler alınamadı.' });
    }
};

/**
 * Get map data (locations of merchants and active users)
 */
const getMapData = async (req, res) => {
    try {
        const merchants = await prisma.merchant.findMany({
            where: {
                latitude: { not: null },
                longitude: { not: null }
            },
            select: {
                id: true,
                companyName: true,
                latitude: true,
                longitude: true
            }
        });

        const activeUsers = await prisma.user.findMany({
            where: {
                latitude: { not: null },
                longitude: { not: null },
                lastActiveAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000) // Active in last hour
                }
            },
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                merchants: merchants.map(m => ({
                    id: m.id,
                    name: m.companyName,
                    lat: m.latitude,
                    lng: m.longitude,
                    type: 'merchant'
                })),
                users: activeUsers.map(u => ({
                    id: u.id,
                    name: u.name || 'Misafir',
                    lat: u.latitude,
                    lng: u.longitude,
                    type: 'user'
                }))
            }
        });
    } catch (err) {
        logger.error('[ADMIN/STATS] Get map data error:', err);
        return res.status(500).json({ success: false, message: 'Harita verileri alınamadı.' });
    }
};

/**
 * Get analytics data (orders & revenue over time)
 */
const getAnalyticsData = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // This is a simplified aggregate for demonstration
        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo }
            },
            select: {
                createdAt: true,
                totalAmount: true,
                status: true
            }
        });

        // Group by day (naive approach for JS)
        const dailyData = {};
        for (let i = 0; i < 30; i++) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            dailyData[date] = { date, orders: 0, revenue: 0 };
        }

        orders.forEach(o => {
            const date = o.createdAt.toISOString().split('T')[0];
            if (dailyData[date]) {
                dailyData[date].orders++;
                dailyData[date].revenue += o.totalAmount;
            }
        });

        return res.status(200).json({
            success: true,
            data: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
        });
    } catch (err) {
        logger.error('[ADMIN/STATS] Get analytics error:', err);
        return res.status(500).json({ success: false, message: 'Analitik verileri alınamadı.' });
    }
};

module.exports = {
    getDashboardStats,
    getMapData,
    getAnalyticsData
};
