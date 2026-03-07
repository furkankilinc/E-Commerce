const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const { logToDb } = require('../../utils/systemLogger');

/**
 * Tüm merchantları getirir (Admin Paneli İçin)
 */
const getAllMerchants = async (req, res) => {
    try {
        const { search, isActive, isVerified } = req.query;

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

        const merchants = await prisma.merchant.findMany({
            where,
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({ success: true, merchants });
    } catch (err) {
        logger.error('[ADMIN/MERCHANT] GetAll error:', err);
        return res.status(500).json({ success: false, message: 'Merchantlar alınamadı.' });
    }
};

/**
 * Detaylı merchant bilgisi ve logları getirir
 */
const getMerchantById = async (req, res) => {
    try {
        const { id } = req.params;
        const merchant = await prisma.merchant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!merchant) {
            return res.status(404).json({ success: false, message: 'Merchant bulunamadı.' });
        }

        // Merchant ile ilgili logları getir (Son 100 log)
        const logs = await prisma.systemLog.findMany({
            where: {
                OR: [
                    { userId: id },
                    { targetId: id, targetType: 'MERCHANT' }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Merchant login seanslarını (refresh tokens) getir
        const sessions = await prisma.merchantRefreshToken.findMany({
            where: { merchantId: id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return res.status(200).json({ success: true, merchant, logs, sessions });
    } catch (err) {
        logger.error('[ADMIN/MERCHANT] GetById error:', err);
        return res.status(500).json({ success: false, message: 'Merchant bilgileri alınamadı.' });
    }
};

/**
 * Merchant durumunu günceller (Aktif/Pasif/Onaylı vb.)
 */
const updateMerchantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, isVerified } = req.body;

        const merchant = await prisma.merchant.update({
            where: { id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(isVerified !== undefined && { isVerified })
            }
        });

        // İşlemi logla
        await logToDb({
            level: 'warn',
            action: 'MERCHANT_STATUS_UPDATE',
            message: `Merchant (${merchant.companyName}) durumu admin tarafından güncellendi.`,
            userId: req.user.sub, // Admin ID
            userRole: 'ADMIN',
            targetId: merchant.id,
            targetType: 'MERCHANT',
            meta: { isActive, isVerified }
        });

        return res.status(200).json({ success: true, message: 'Merchant durumu güncellendi.', merchant });
    } catch (err) {
        logger.error('[ADMIN/MERCHANT] UpdateStatus error:', err);
        return res.status(500).json({ success: false, message: 'Güncelleme başarısız.' });
    }
};

module.exports = {
    getAllMerchants,
    getMerchantById,
    updateMerchantStatus
};
