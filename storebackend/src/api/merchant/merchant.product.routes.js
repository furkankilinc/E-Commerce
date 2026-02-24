const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
// const { authenticate } = require('../../middlewares/auth.middleware'); // Assuming authenticate is adapted for JS or used differently

const prisma = new PrismaClient();
const router = Router();

// Middleware placeholder for merchant auth
// In a real app, you'd use authenticate('merchant')
const mockMerchantAuth = async (req, res, next) => {
    // For demonstration, we'll assume a merchant is logged in
    // In production, this would come from the JWT payload
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return res.status(401).json({ message: 'Merchant not found' });
    req.merchantId = merchant.id;
    next();
};

// POST /api/merchant/products
router.post('/', mockMerchantAuth, async (req, res) => {
    try {
        const {
            name, description, price, categoryId, images, variants, sku, stock
        } = req.body;

        const product = await prisma.product.create({
            data: {
                name,
                slug: name.toLowerCase().replace(/ /g, '-'),
                description,
                price: parseFloat(price),
                sku: sku || `SKU-${Date.now()}`,
                stock: parseInt(stock) || 0,
                merchantId: req.merchantId,
                categoryId,
                images: {
                    create: images.map((url, index) => ({
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
router.get('/', mockMerchantAuth, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { merchantId: req.merchantId },
            include: {
                images: true,
                category: true
            }
        });
        return res.json(products);
    } catch (err) {
        console.error('[merchant/getProducts]', err);
        return res.status(500).json({ message: 'Ürünler listelenemedi.' });
    }
});

module.exports = router;
