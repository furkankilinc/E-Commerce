const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return res.json(categories);
    } catch (err) {
        console.error('[categories/getAll]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
