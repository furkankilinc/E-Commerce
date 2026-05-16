const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');

/**
 * Get all users for administration
 */
const getAllUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * parseInt(limit);
        
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    isActive: true,
                    createdAt: true,
                    lastActiveAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.user.count({ where })
        ]);

        return res.status(200).json({ 
            success: true, 
            users,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        logger.error('[ADMIN/USER] Get all users error:', err);
        return res.status(500).json({ success: false, message: 'Kullanıcılar alınamadı.' });
    }
};

/**
 * Update user status (Active/Inactive)
 */
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { isActive: !!isActive }
        });

        logger.info(`[ADMIN/USER] User ${id} status updated: isActive=${isActive}`);
        return res.status(200).json({ success: true, message: 'Kullanıcı durumu güncellendi.', user });
    } catch (err) {
        logger.error('[ADMIN/USER] Update user status error:', err);
        return res.status(500).json({ success: false, message: 'Kullanıcı durumu güncellenemedi.' });
    }
};

/**
 * Delete user (Permanent - Use with caution)
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Perform cascading removal or just deactivation in prod, but for full admin: delete
        await prisma.user.delete({
            where: { id }
        });

        logger.info(`[ADMIN/USER] User ${id} deleted by admin`);
        return res.status(200).json({ success: true, message: 'Kullanıcı kalıcı olarak silindi.' });
    } catch (err) {
        logger.error('[ADMIN/USER] Delete user error:', err);
        return res.status(500).json({ success: false, message: 'Kullanıcı silinemedi.' });
    }
};

module.exports = {
    getAllUsers,
    updateUserStatus,
    deleteUser
};
