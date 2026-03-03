const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middlewares/auth.middleware');

const prisma = new PrismaClient();
const router = Router();

// ─── PUBLIC / MERCHANT ─────────────────────────────────────────────────────────

// GET /api/attributes - List all attributes and their values
router.get('/', async (req, res) => {
    try {
        const attributes = await prisma.attribute.findMany({
            include: {
                values: true,
                categories: true
            },
            orderBy: { name: 'asc' }
        });
        return res.json(attributes);
    } catch (err) {
        console.error('[attributes/getAll]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// ─── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/attributes/admin - Same as public but can be extended for more data
router.get('/admin', authenticate('admin'), async (req, res) => {
    try {
        const attributes = await prisma.attribute.findMany({
            include: {
                values: true,
                categories: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(attributes);
    } catch (err) {
        console.error('[attributes/adminGetAll]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/attributes/admin - Create attribute with values
router.post('/admin', authenticate('admin'), async (req, res) => {
    try {
        const { name, values, categoryIds } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'İsim zorunludur.' });
        }

        const attribute = await prisma.attribute.create({
            data: {
                name,
                values: {
                    create: (values || []).map(v => ({ value: v }))
                },
                categories: categoryIds && categoryIds.length > 0 ? {
                    connect: categoryIds.map(id => ({ id }))
                } : undefined
            },
            include: { values: true, categories: true }
        });

        return res.status(201).json(attribute);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'Bu isimde bir özellik zaten var.' });
        }
        console.error('[attributes/adminCreate]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// PUT /api/attributes/admin/:id - Update attribute and its values
router.put('/admin/:id', authenticate('admin'), async (req, res) => {
    try {
        const { name, values, categoryIds } = req.body;

        // Transaction to update attribute and sync values
        const attribute = await prisma.$transaction(async (tx) => {
            // Update attribute name
            const updatedAttr = await tx.attribute.update({
                where: { id: req.params.id },
                data: {
                    name,
                    categories: categoryIds ? {
                        set: categoryIds.map(id => ({ id }))
                    } : undefined
                }
            });

            if (values) {
                // Simplified sync: delete old and create new
                await tx.attributeValue.deleteMany({
                    where: { attributeId: req.params.id }
                });

                await tx.attributeValue.createMany({
                    data: values.map(v => ({
                        attributeId: req.params.id,
                        value: v
                    }))
                });
            }

            return tx.attribute.findUnique({
                where: { id: req.params.id },
                include: { values: true, categories: true }
            });
        });

        return res.json(attribute);
    } catch (err) {
        console.error('[attributes/adminUpdate]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// DELETE /api/attributes/admin/:id - Delete attribute
router.delete('/admin/:id', authenticate('admin'), async (req, res) => {
    try {
        await prisma.attribute.delete({
            where: { id: req.params.id }
        });
        return res.json({ message: 'Özellik silindi.' });
    } catch (err) {
        console.error('[attributes/adminDelete]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
