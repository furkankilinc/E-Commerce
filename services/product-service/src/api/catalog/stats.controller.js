const prisma = require('../../config/prisma');

const getDashboardStats = async (req, res) => {
    try {
        // Sadece kendi veritabanımızdaki (product-db) bilgileri alabiliriz
        const productCount = await prisma.product.count({ where: { status: 'PUBLISHED' } });
        
        const lowStock = await prisma.product.findMany({
            where: { 
                stock: { gt: 0, lte: 10 }, 
                status: 'PUBLISHED' 
            },
            take: 10,
            select: {
                id: true,
                name: true,
                stock: true
            }
        });

        // Diğer verileri (user, merchant count) mikroservis yapısında başka servislerden 
        // çekmek gerekir. Şimdilik arayüzün çökmemesi için mock (sabit) değerler döndürüyoruz.
        return res.status(200).json({
            success: true,
            stats: {
                totalMerchants: 15, // Mock data
                totalProducts: productCount,
                totalUsers: 250,   // Mock data
                onlineUsers: 42,   // Mock data
                lowStock: lowStock
            }
        });
    } catch (err) {
        console.error('[STATS] Error:', err);
        return res.status(500).json({ success: false, message: 'İstatistikler alınamadı.' });
    }
};

const getMapData = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: { merchants: [], users: [] }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Harita verileri alınamadı.' });
    }
};

const getAnalytics = async (req, res) => {
    try {
        // Mock data for analytics
        const data = Array.from({ length: 30 }).map((_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
            revenue: Math.floor(Math.random() * 5000) + 1000,
            orders: Math.floor(Math.random() * 50) + 10
        }));

        return res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        console.error('[ANALYTICS] Error:', err);
        return res.status(500).json({ success: false, message: 'Analitik verileri alınamadı.' });
    }
};

const getMerchantStats = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        
        const [totalProducts, activeProducts, lowStockProducts] = await Promise.all([
            prisma.product.count({ where: { merchantId } }),
            prisma.product.count({ where: { merchantId, status: 'PUBLISHED' } }),
            prisma.product.count({ where: { merchantId, stock: { gt: 0, lte: 10 } } })
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalProducts,
                activeProducts,
                lowStockProducts,
                totalSales: 0, // Should come from order-service
                revenue: 0    // Should come from order-service
            }
        });
    } catch (err) {
        console.error('[MERCHANT_STATS] Error:', err);
        return res.status(500).json({ success: false, message: 'İstatistikler alınamadı.' });
    }
};

module.exports = { getDashboardStats, getMapData, getAnalytics, getMerchantStats };
