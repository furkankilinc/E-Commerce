const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middlewares/auth.middleware');
const logger = require('../../utils/logger');

const prisma = new PrismaClient();
const router = Router();


// POST /api/merchant/products
router.post('/', authenticate('merchant'), async (req, res) => {
    try {
        const {
            name, description, price, categoryId, images, variants, sku, stock,
            status, metadata, currency = 'TL'
        } = req.body;

        const product = await prisma.product.create({
            data: {
                name,
                slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
                description,
                    price: parseFloat(price),
                discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : null,
                isOnSale: req.body.isOnSale === true || !!req.body.discountPrice,
                sku: sku || `SKU-${Date.now()}`,
                stock: parseInt(stock) || 0,
                merchantId: req.user.sub,
                categoryId,
                status: status || 'PUBLISHED',
                metadata: {
                    ...(metadata || {}),
                    currency
                },
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
        logger.error('[merchant/createProduct]', err);
        return res.status(500).json({ message: 'Ürün oluşturulamadı.' });
    }
});

// GET /api/merchant/products
router.get('/', authenticate('merchant'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const stockStatus = req.query.stockStatus;
        const search = req.query.search;
        const skip = (page - 1) * limit;

        const where = { merchantId: req.user.sub };
        if (status) {
            where.status = status;
        }
        if (stockStatus === 'low') {
            where.stock = { gt: 0, lte: 10 };
        } else if (stockStatus === 'out') {
            where.stock = { lte: 0 };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [products, total, stockSum] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: {
                    images: true,
                    category: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.product.count({
                where
            }),
            prisma.product.aggregate({
                where: { merchantId: req.user.sub }, // Global merchant total
                _sum: { stock: true }
            })
        ]);

        console.log(`[STOCKS_DEBUG] Merchant: ${req.user.sub}, Sum:`, stockSum._sum.stock);

        return res.json({
            products,
            pagination: {
                total,
                totalStock: stockSum._sum.stock || 0,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        logger.error('[merchant/getProducts]', err);
        return res.status(500).json({ message: 'Ürünler listelenemedi.' });
    }
});

// GET /api/merchant/products/:id
router.get('/:id', authenticate('merchant'), async (req, res) => {
    try {
        const product = await prisma.product.findFirst({
            where: {
                id: req.params.id,
                merchantId: req.user.sub
            },
            include: {
                images: true,
                variants: true,
                category: true
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        return res.json(product);
    } catch (err) {
        logger.error('[merchant/getProduct]', err, { productId: req.params.id });
        return res.status(500).json({ message: 'Ürün bilgisi alınamadı.' });
    }
});

// PUT /api/merchant/products/:id
router.put('/:id', authenticate('merchant'), async (req, res) => {
    try {
        const {
            name, description, price, categoryId, images, variants, sku, stock,
            status, metadata, currency
        } = req.body;

        // Check if product belongs to merchant
        const existing = await prisma.product.findFirst({
            where: { id: req.params.id, merchantId: req.user.sub }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: {
                name,
                description,
                price: price !== undefined ? parseFloat(price) : undefined,
                discountPrice: req.body.discountPrice !== undefined ? (req.body.discountPrice ? parseFloat(req.body.discountPrice) : null) : undefined,
                isOnSale: req.body.isOnSale !== undefined ? !!req.body.isOnSale : (req.body.discountPrice ? true : undefined),
                sku,
                stock: stock !== undefined ? parseInt(stock) : undefined,
                categoryId,
                status,
                metadata: {
                    ...(metadata || (existing.metadata || {})),
                    ...(currency ? { currency } : {})
                },
                // Update images: delete all existing and create new ones
                images: images ? {
                    deleteMany: {},
                    create: images.map((url, index) => ({
                        url,
                        isMain: index === 0,
                        order: index
                    }))
                } : undefined,
                // Update variants: delete all existing and create new ones
                variants: variants ? {
                    deleteMany: {},
                    create: variants
                } : undefined
            }
        });

        return res.json(product);
    } catch (err) {
        logger.error('[merchant/updateProduct]', err, { productId: req.params.id });
        return res.status(500).json({ message: 'Ürün güncellenemedi.' });
    }
});

// DELETE /api/merchant/products/:id
router.delete('/:id', authenticate('merchant'), async (req, res) => {
    try {
        const product = await prisma.product.findFirst({
            where: { id: req.params.id, merchantId: req.user.sub }
        });

        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        await prisma.product.delete({
            where: { id: req.params.id }
        });

        return res.json({ message: 'Ürün başarıyla silindi.' });
    } catch (err) {
        logger.error('[merchant/deleteProduct]', err, { productId: req.params.id });
        return res.status(500).json({ message: 'Ürün silinemedi.' });
    }
});

// PATCH /api/merchant/products/bulk-stock
router.patch('/bulk-stock', authenticate('merchant'), async (req, res) => {
    try {
        const { updates } = req.body;
        // updates = [{ productId, stock }]

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ message: 'Güncellenecek stok verisi bulunamadı.' });
        }

        const results = await prisma.$transaction(
            updates.map(u =>
                prisma.product.updateMany({
                    where: {
                        id: u.productId,
                        merchantId: req.user.sub
                    },
                    data: {
                        stock: parseInt(u.stock)
                    }
                })
            )
        );

        return res.json({ success: true, message: `${results.length} ürün stoğu güncellendi.` });
    } catch (err) {
        logger.error('[merchant/bulkStock]', err);
        return res.status(500).json({ message: 'Stok güncellemesi başarısız.' });
    }
});

module.exports = router;
