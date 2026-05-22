const prisma = require('../../config/prisma');

const getAllUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const skip = (parsedPage - 1) * parsedLimit;

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: { id: true, email: true, name: true, phone: true, isActive: true, createdAt: true },
                skip,
                take: parsedLimit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        const pages = Math.ceil(total / parsedLimit) || 1;

        return res.status(200).json({ 
            success: true, 
            users, 
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
        return res.status(500).json({ success: false, message: 'Kullanıcılar alınamadı.' });
    }
};

const getAllMerchants = async (req, res) => {
    try {
        const { search, isActive, isVerified, page = 1, limit = 10 } = req.query;
        
        const where = {};
        if (search) {
            where.OR = [
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { contactPerson: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (isVerified !== undefined) where.isVerified = isVerified === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [merchantsRaw, total] = await Promise.all([
            prisma.merchant.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.merchant.count({ where })
        ]);

        // Mock _count.products deterministically since products are in another DB
        const merchants = merchantsRaw.map(m => ({
            ...m,
            _count: { products: m.companyName.length * 3 } // Mock product count based on name length
        }));

        return res.status(200).json({
            success: true,
            merchants,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)) || 1
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Satıcılar alınamadı.' });
    }
};

const getMerchantById = async (req, res) => {
    try {
        const { id } = req.params;
        const merchant = await prisma.merchant.findUnique({ where: { id } });
        if (!merchant) return res.status(404).json({ success: false, message: 'Satıcı bulunamadı.' });

        const sessions = await prisma.merchantRefreshToken.findMany({
            where: { merchantId: id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Mock _count.products deterministically
        merchant._count = { products: merchant.companyName.length * 3 };

        return res.status(200).json({
            success: true,
            merchant,
            sessions,
            logs: [] // Mock logs since systemLogs are not fully connected
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Satıcı alınamadı.' });
    }
};

const updateMerchantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, isVerified } = req.body;
        
        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isVerified !== undefined) updateData.isVerified = isVerified;

        const merchant = await prisma.merchant.update({
            where: { id },
            data: updateData
        });

        merchant._count = { products: merchant.companyName.length * 3 };

        return res.status(200).json({ success: true, merchant });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Satıcı güncellenemedi.' });
    }
};

module.exports = { getAllUsers, getAllMerchants, getMerchantById, updateMerchantStatus };
