const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middlewares/auth.middleware');
const logger = require('../../utils/logger');

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /api/reviews
 * Create a review - only allowed if user has a DELIVERED order containing this product
 */
router.post('/', authenticate('user'), async (req, res) => {
    try {
        const userId = req.user.sub;
        const { productId, rating, title, comment, images } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Ürün ID, puan ve yorum gereklidir.' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Puan 1-5 arasında olmalıdır.' });
        }

        // Check if user already left a review for this product
        const existingReview = await prisma.review.findFirst({
            where: { productId, userId }
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'Bu ürün için zaten bir değerlendirme yaptınız.' });
        }

        // Check if user has a DELIVERED order containing this product
        const deliveredOrder = await prisma.order.findFirst({
            where: {
                userId,
                status: 'DELIVERED',
                items: {
                    some: {
                        productId
                    }
                }
            }
        });

        if (!deliveredOrder) {
            return res.status(403).json({
                success: false,
                message: 'Yalnızca teslim edilen siparişlerdeki ürünlere değerlendirme yapabilirsiniz.'
            });
        }

        // Create the review
        const review = await prisma.review.create({
            data: {
                productId,
                userId,
                rating: parseInt(rating),
                title: title || null,
                comment,
                isVerified: true, // Verified because we confirmed delivery
                images: images && images.length > 0 ? {
                    create: images.map(url => ({ url }))
                } : undefined
            },
            include: {
                user: { select: { name: true } }
            }
        });

        // Recalculate product rating
        const reviews = await prisma.review.findMany({
            where: { productId },
            select: { rating: true }
        });

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await prisma.product.update({
            where: { id: productId },
            data: {
                rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
                reviewCount: reviews.length
            }
        });

        return res.status(201).json({ success: true, review });
    } catch (err) {
        logger.error('[REVIEW/CREATE] error:', err);
        return res.status(500).json({ success: false, message: 'Değerlendirme oluşturulurken hata oluştu.' });
    }
});

/**
 * GET /api/reviews/can-review/:productId
 * Check if the logged-in user can review a specific product
 */
router.get('/can-review/:productId', authenticate('user'), async (req, res) => {
    try {
        const userId = req.user.sub;
        const { productId } = req.params;

        // Check if already reviewed
        const existingReview = await prisma.review.findFirst({
            where: { productId, userId }
        });

        if (existingReview) {
            return res.json({ canReview: false, reason: 'already_reviewed' });
        }

        // Check if has delivered order
        const deliveredOrder = await prisma.order.findFirst({
            where: {
                userId,
                status: 'DELIVERED',
                items: {
                    some: { productId }
                }
            }
        });

        if (!deliveredOrder) {
            return res.json({ canReview: false, reason: 'no_delivered_order' });
        }

        return res.json({ canReview: true });
    } catch (err) {
        logger.error('[REVIEW/CAN-REVIEW] error:', err);
        return res.status(500).json({ success: false, message: 'Kontrol sırasında hata oluştu.' });
    }
});

module.exports = router;
