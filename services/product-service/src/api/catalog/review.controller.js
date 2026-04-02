const prisma = require('../../config/prisma');

const canReview = async (req, res) => {
    try {
        const { id: productId } = req.params;
        // Basic implementation: for now allow everyone for demo
        // In real app, check if user has purchased this product and if order status is SHIPPED/DELIVERED
        return res.json({ canReview: true, reason: '' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'İnceleme kontrolü yapılamadı.' });
    }
};

const createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;
        const userId = req.user?.userId; // Taken from auth middleware

        if (!productId || rating === undefined || !comment) {
            return res.status(400).json({ success: false, message: 'Lütfen zorunlu alanları doldurun.' });
        }

        const review = await prisma.review.create({
            data: {
                productId,
                userId: userId || 'anonymous',
                rating: Number(rating),
                title,
                comment,
                isVerified: true
            }
        });

        // Recalculate product rating & reviewCount
        const stats = await prisma.review.aggregate({
            where: { productId },
            _avg: { rating: true },
            _count: { id: true }
        });

        await prisma.product.update({
            where: { id: productId },
            data: {
                rating: stats._avg.rating || 0,
                reviewCount: stats._count.id || 0
            }
        });

        return res.status(201).json({ success: true, review });
    } catch (err) {
        console.error('[REVIEW_CREATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Değerlendirme gönderilemedi.' });
    }
};

module.exports = { canReview, createReview };
