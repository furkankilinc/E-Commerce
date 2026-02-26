const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
// const { authenticate } = require('../../middlewares/auth.middleware'); // Assuming authenticate is adapted for JS or used differently

const prisma = new PrismaClient();
const router = Router();

const { verifyToken } = require('../../utils/token.util');

// Real merchant authentication based on JWT token
const merchantAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyToken(token, 'merchant');
        req.merchantId = payload.sub; // sub contains the merchant ID
        next();
    } catch (err) {
        console.error('[merchant/auth]', err);
        return res.status(401).json({ message: 'Token geçersiz veya süresi dolmuş.' });
    }
};

// POST /api/merchant/products
router.post('/', merchantAuth, async (req, res) => {
    try {
        const {
            name, description, price, categoryId, images, variants, sku, stock,
            status, metadata
        } = req.body;

        const product = await prisma.product.create({
            data: {
                name,
                slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
                description,
                price: parseFloat(price),
                sku: sku || `SKU-${Date.now()}`,
                stock: parseInt(stock) || 0,
                merchantId: req.merchantId,
                categoryId,
                status: status || 'PUBLISHED',
                metadata: metadata || {},
                images: {
                    create: (images || []).map((url, index) => ({
                        url,
                        isMain: index === 0,
                        order: index
                    }))
                },
                variants: {
                    create: variants || []
                }
            },
            include: {
                images: true,
                category: true
            }
        });

        return res.status(201).json(product);
    } catch (err) {
        console.error('[merchant/createProduct]', err);
        return res.status(500).json({ message: 'Ürün oluşturulamadı.' });
    }
});

// GET /api/merchant/products
router.get('/', merchantAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where: { merchantId: req.merchantId },
                include: {
                    images: true,
                    category: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.product.count({
                where: { merchantId: req.merchantId }
            })
        ]);

        return res.json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('[merchant/getProducts]', err);
        return res.status(500).json({ message: 'Ürünler listelenemedi.' });
    }
});

module.exports = router;
