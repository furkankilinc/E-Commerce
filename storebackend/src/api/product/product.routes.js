const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

// Helper to get all descendant category IDs
async function getDescendantIds(slug) {
    if (!slug) return null;
    const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, parentId: true, slug: true }
    });
    const root = allCategories.find(c => c.slug === slug);
    if (!root) return [];
    const ids = [root.id];
    const findChildren = (parentId) => {
        const children = allCategories.filter(c => c.parentId === parentId);
        children.forEach(child => {
            ids.push(child.id);
            findChildren(child.id);
        });
    };
    findChildren(root.id);
    return ids;
}

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            rating,
            merchants,
            sort,
            variants,
            isNewArrival,
            isOnSale,
            page = 1,
            limit = 20
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            isActive: true,
            status: 'PUBLISHED'
        };

        if (category) {
            const categoryIds = await getDescendantIds(category);
            where.categoryId = { in: categoryIds };
        }
        
        if (isNewArrival === 'true') {
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            where.createdAt = { gte: last24h };
        }
        
        if (isOnSale === 'true') {
            where.discountPrice = { gt: 0 };
        }

        if (search) {
            // PostgreSQL Full-Text Search integration
            // Uses 'turkish' dictionary for stemming and stop-words
            // Also supports prefix matching with :* for "search as you type" feel
            const formattedSearch = search.trim().split(/\s+/).join(' & ') + ':*';

            const searchResults = await prisma.$queryRaw`
                SELECT id FROM products 
                WHERE to_tsvector('turkish', name || ' ' || description) @@ to_tsquery('turkish', ${formattedSearch})
                AND "isActive" = true AND status = 'PUBLISHED'
            `;

            const matchingIds = searchResults.map(r => r.id);
            where.id = { in: matchingIds };
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        if (rating) {
            where.rating = { gte: parseFloat(rating) };
        }

        if (merchants) {
            const merchantList = merchants.split(',');
            where.merchantId = { in: merchantList };
        }

        if (variants) {
            const variantGroups = variants.split(';');
            const variantConditions = variantGroups.map(group => {
                const [name, valuesStr] = group.split(':');
                const values = valuesStr.split(',');
                return {
                    variants: {
                        some: {
                            name,
                            value: { in: values }
                        }
                    }
                };
            });
            where.AND = [...(where.AND || []), ...variantConditions];
        }

        let orderBy = { createdAt: 'desc' };
        if (sort) {
            switch (sort) {
                case 'newest': orderBy = { createdAt: 'desc' }; break;
                case 'price-low': orderBy = { price: 'asc' }; break;
                case 'price-high': orderBy = { price: 'desc' }; break;
                case 'rating': orderBy = { rating: 'desc' }; break;
                case 'popular': orderBy = { reviewCount: 'desc' }; break;
            }
        }

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: {
                    images: true,
                    category: true,
                    variants: true,
                    merchant: { select: { id: true, companyName: true } }
                },
                skip,
                take: parseInt(limit),
                orderBy
            }),
            prisma.product.count({ where })
        ]);

        return res.json({
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
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
                category: {
                    include: {
                        parent: true
                    }
                },
                variants: true,
                merchant: { select: { companyName: true } },
                reviews: {
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!product) return res.status(404).json({ message: 'Ürün bulunamadı.' });
        return res.json(product);
    } catch (err) {
        console.error('[products/getById]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
