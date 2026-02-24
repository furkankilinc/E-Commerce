const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

// GET /api/products
// Fetch all products with images and categories
router.get('/', async (req, res) => {
    try {
        const { category, search, limit = 20 } = req.query;

        const where = {
            isActive: true,
        };

        if (category) {
            where.category = { slug: category };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                images: true,
                category: true,
                merchant: {
                    select: {
                        companyName: true
                    }
                }
            },
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });

        return res.json(products);
    } catch (err) {
        console.error('[products/getAll]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                images: true,
                category: true,
                variants: true,
                merchant: {
                    select: {
                        companyName: true
                    }
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        return res.json(product);
    } catch (err) {
        console.error('[products/getById]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
