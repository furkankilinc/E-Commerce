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

module.exports = { getDashboardStats, getMapData };
