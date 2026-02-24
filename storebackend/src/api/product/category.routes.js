const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

// ─── PUBLIC ────────────────────────────────────────────────────────────────────

// GET /api/categories - Get all active categories (flat list with parentId)
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                image: true,
                filterValues: true,
                _count: { select: { children: true, products: true } }
            },
            orderBy: { name: 'asc' }
        });
        return res.json(categories);
    } catch (err) {
        console.error('[categories/getAll]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// ─── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/categories/admin - All categories (including inactive)
router.get('/admin', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true,
                parentId: true,
                isActive: true,
                filterValues: true,
                createdAt: true,
                _count: { select: { children: true, products: true } }
            },
            orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
        });
        return res.json(categories);
    } catch (err) {
        console.error('[categories/adminGetAll]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/categories/admin - Create category
router.post('/admin', async (req, res) => {
    try {
        const { name, slug, description, image, parentId, filterValues } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: 'Name ve slug zorunludur.' });
        }

        // Verify parent exists if provided
        if (parentId) {
            const parent = await prisma.category.findUnique({ where: { id: parentId } });
            if (!parent) return res.status(400).json({ message: 'Üst kategori bulunamadı.' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug: slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                description: description || null,
                image: image || null,
                parentId: parentId || null,
                filterValues: filterValues || {},
                isActive: true
            }
        });

        return res.status(201).json(category);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'Bu slug zaten kullanılıyor.' });
        }
        console.error('[categories/adminCreate]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// PUT /api/categories/admin/:id - Update category
router.put('/admin/:id', async (req, res) => {
    try {
        const { name, slug, description, image, parentId, filterValues, isActive } = req.body;

        // Prevent setting self as parent
        if (parentId === req.params.id) {
            return res.status(400).json({ message: 'Kategori kendi kendisinin üst kategorisi olamaz.' });
        }

        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(slug !== undefined && { slug: slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }),
                ...(description !== undefined && { description }),
                ...(image !== undefined && { image }),
                ...(parentId !== undefined && { parentId: parentId || null }),
                ...(filterValues !== undefined && { filterValues }),
                ...(isActive !== undefined && { isActive })
            }
        });

        return res.json(category);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Kategori bulunamadı.' });
        }
        console.error('[categories/adminUpdate]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// DELETE /api/categories/admin/:id - Delete (soft delete)
router.delete('/admin/:id', async (req, res) => {
    try {
        // Check for children
        const childCount = await prisma.category.count({ where: { parentId: req.params.id } });
        if (childCount > 0) {
            return res.status(400).json({ message: 'Alt kategorisi olan kategori silinemez.' });
        }

        const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
        if (productCount > 0) {
            // Soft delete
            await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
            return res.json({ message: 'Kategori pasif yapıldı (ürünleri mevcut).' });
        }

        await prisma.category.delete({ where: { id: req.params.id } });
        return res.json({ message: 'Kategori silindi.' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Kategori bulunamadı.' });
        }
        console.error('[categories/adminDelete]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
