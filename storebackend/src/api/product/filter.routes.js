const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

// Helper to get all descendant category IDs (recursive)
async function getDescendantIds(slug) {
    if (!slug) return null;

    const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, parentId: true, slug: true, filterValues: true }
    });

    const root = allCategories.find(c => c.slug === slug);
    if (!root) return { ids: [], filterValues: null };

    const ids = [root.id];
    const findChildren = (parentId) => {
        const children = allCategories.filter(c => c.parentId === parentId);
        children.forEach(child => {
            ids.push(child.id);
            findChildren(child.id);
        });
    };
    findChildren(root.id);

    return { ids, filterValues: root.filterValues };
}

// GET /api/products-meta/filters
router.get('/filters', async (req, res) => {
    try {
        const { category } = req.query;

        // Always fetch all categories for sidebar tree
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true, parentId: true, filterValues: true }
        });

        const catResult = await getDescendantIds(category);
        const categoryIds = catResult ? catResult.ids : null;
        const categoryFilterValues = catResult ? catResult.filterValues : null;

        const contextualWhere = {
            status: 'PUBLISHED',
            isActive: true,
            ...(categoryIds && { categoryId: { in: categoryIds } })
        };

        const [merchants, priceStats, productVariants] = await prisma.$transaction([
            prisma.merchant.findMany({
                where: {
                    isActive: true,
                    products: { some: contextualWhere }
                },
                select: { id: true, companyName: true }
            }),
            prisma.product.aggregate({
                where: contextualWhere,
                _max: { price: true },
                _min: { price: true }
            }),
            prisma.productVariant.findMany({
                where: { product: contextualWhere },
                select: { name: true, value: true },
                distinct: ['name', 'value']
            })
        ]);

        // Group product variants by name (e.g. Color → [Red, Blue])
        const variantsFromProducts = productVariants.reduce((acc, curr) => {
            if (!acc[curr.name]) acc[curr.name] = [];
            if (!acc[curr.name].includes(curr.value)) acc[curr.name].push(curr.value);
            return acc;
        }, {});

        // PRIORITY: Use category-defined filterValues if set, otherwise fall back to product variants
        let finalVariants = variantsFromProducts;
        if (categoryFilterValues && Object.keys(categoryFilterValues).length > 0) {
            // Show admin-defined filters for this category
            // But also cross-reference with actual product variant data to only show values that exist
            finalVariants = Object.entries(categoryFilterValues).reduce((acc, [name, allowedValues]) => {
                // Include all admin-defined values (they may not have product variants yet)
                acc[name] = allowedValues;
                return acc;
            }, {});
        }

        return res.json({
            categories,
            merchants,
            priceRange: {
                min: priceStats._min.price || 0,
                max: priceStats._max.price || 0
            },
            variants: finalVariants
        });
    } catch (err) {
        console.error('[products/getFilters]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
