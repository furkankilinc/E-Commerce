const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');

/**
 * Get all products for moderation
 */
const getAllProducts = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: {
                    merchant: {
                        select: {
                            id: true,
                            companyName: true,
                            email: true
                        }
                    },
                    category: {
                        select: {
                            name: true
                        }
                    },
                    images: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.product.count({ where })
        ]);

        return res.status(200).json({ 
            success: true, 
            products,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        logger.error('[ADMIN/PRODUCT] Get all products error:', err);
        return res.status(500).json({ success: false, message: 'Ürünler alınamadı.' });
    }
};

/**
 * Update product status (Approve/Reject)
 */
const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PUBLISHED', 'DRAFT', 'REJECTED', 'PENDING_APPROVAL'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Geçersiz durum.' });
        }

        const product = await prisma.product.update({
            where: { id },
            data: { status }
        });

        logger.info(`[ADMIN/PRODUCT] Product ${id} status updated to ${status}`);
        return res.status(200).json({ success: true, message: 'Ürün durumu güncellendi.', product });
    } catch (err) {
        logger.error('[ADMIN/PRODUCT] Update product status error:', err);
        return res.status(500).json({ success: false, message: 'Ürün durumu güncellenemedi.' });
    }
};

/**
 * Delete product (Permanent)
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: { id }
        });

        logger.info(`[ADMIN/PRODUCT] Product ${id} deleted by admin`);
        return res.status(200).json({ success: true, message: 'Ürün kalıcı olarak silindi.' });
    } catch (err) {
        logger.error('[ADMIN/PRODUCT] Delete product error:', err);
        return res.status(500).json({ success: false, message: 'Ürün silinemedi.' });
    }
};

module.exports = {
    getAllProducts,
    updateProductStatus,
    deleteProduct
};
