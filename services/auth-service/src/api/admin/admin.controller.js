const prisma = require('../../config/prisma');

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, phone: true, isActive: true, createdAt: true }
        });
        return res.status(200).json({ success: true, users });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Kullanıcılar alınamadı.' });
    }
};

const getAllMerchants = async (req, res) => {
    try {
        const merchants = await prisma.merchant.findMany();
        return res.status(200).json({ success: true, merchants });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Satıcılar alınamadı.' });
    }
};

module.exports = { getAllUsers, getAllMerchants };
