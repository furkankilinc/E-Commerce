const prisma = require('../config/prisma');
const logger = require('./logger');

/**
 * Veritabanına sistem logu kaydeder
 * @param {Object} params - Log parametreleri
 * @param {string} params.level - info, warn, error
 * @param {string} params.action - İşlem adı (örn: MERCHANT_LOGIN)
 * @param {string} params.message - Log mesajı
 * @param {Object} [params.meta] - Ekstra veriler
 * @param {string} [params.userId] - İlgili kullanıcı ID
 * @param {string} [params.userRole] - Kullanıcı rolü (ADMIN, MERCHANT, USER)
 * @param {string} [params.targetId] - İlgili hedef ID (Ürün ID, Sipariş ID vb.)
 * @param {string} [params.targetType] - Hedef tipi (PRODUCT, ORDER, vb.)
 */
const logToDb = async ({ level = 'info', action, message, meta, userId, userRole, targetId, targetType }) => {
    try {
        await prisma.systemLog.create({
            data: {
                level,
                action,
                message,
                meta: meta || {},
                userId,
                userRole,
                targetId,
                targetType
            }
        });
    } catch (err) {
        logger.error(`[SystemLogger] DB log hatası: ${err.message}`, { action, message });
    }
};

module.exports = {
    logToDb
};
