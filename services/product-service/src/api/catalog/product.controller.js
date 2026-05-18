const prisma = require('../../config/prisma');

const getAllProducts = async (req, res) => {
    try {
        const {
            category: categorySlug,
            minPrice,
            maxPrice,
            merchants: merchantIdQuery,
            search,
            sort,
            isNewArrival,
            isOnSale,
            limit = 20,
            offset = 0,
            status
        } = req.query;

        console.log('[PRODUCT_LIST] Received Query:', req.query);

        const isAdminRequest = req.originalUrl.includes('/admin/');

        // Standard filter for public view: PUBLISHED and ACTIVE
        let where = isAdminRequest ? {} : { status: 'PUBLISHED', isActive: true };

        // If it's a merchant-specific request (via route /merchant/products)
        const isMerchantRequest = req.originalUrl.includes('/merchant/');

        if (isMerchantRequest) {
            // Merchants should see THEIR products, regardless of status
            if (req.user && (req.user.audience === 'merchant' || req.user.role === 'MERCHANT')) {
                // req.user.sub is the ID in auth-service token
                where = { merchantId: req.user.sub };
            } else {
                return res.status(403).json({ success: false, message: 'Merchant identity not found' });
            }
        }

        // Apply status filter if explicitly requested (only for merchant or admin requests)
        if (status && (isMerchantRequest || isAdminRequest)) {
            where.status = status;
        }

        // Apply filters only if it's NOT a restricted merchant request, 
        // or merge them if you want merchants to be able to filter their own list.

        // 1. Category Filtering
        if (categorySlug) {
            const category = await prisma.category.findUnique({
                where: { slug: categorySlug },
                include: { children: { select: { id: true } } }
            });

            if (category) {
                const categoryIds = [category.id, ...category.children.map(c => c.id)];
                where.categoryId = { in: categoryIds };
            }
        }

        // 2. Flags
        if (isNewArrival === 'true') where.isNewArrival = true;
        if (isOnSale === 'true') where.isOnSale = true;

        // 3. Price
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        // 4. Manual Merchant filtering (Public route)
        if (!isMerchantRequest && merchantIdQuery) {
            where.merchantId = { in: merchantIdQuery.split(',') };
        }

        // 5. Search
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // 6. Sorting
        let orderBy = { createdAt: 'desc' };
        if (sort === 'price-asc') orderBy = { price: 'asc' };
        else if (sort === 'price-desc') orderBy = { price: 'desc' };
        else if (sort === 'newest') orderBy = { createdAt: 'desc' };
        else if (sort === 'stock-asc') orderBy = { stock: 'asc' };
        else if (sort === 'stock-desc') orderBy = { stock: 'desc' };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { images: true, category: true, variants: true },
                orderBy,
                take: Number(limit),
                skip: Number(offset)
            }),
            prisma.product.count({ where })
        ]);

        return res.json({
            success: true,
            products,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset)
            }
        });
    } catch (err) {
        console.error('[PRODUCT_LIST] Error:', err);
        return res.status(500).json({ success: false, message: 'Ürünler yüklenemedi.' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { images: true, category: true, variants: true, reviews: true }
        });
        if (!product) return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
        return res.json(product); // Vendor panel often expects the raw object
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Ürün detayları alınamadı.' });
    }
};

const getProductMeta = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true, parentId: true }
        });

        const priceAgg = await prisma.product.aggregate({
            where: { status: 'PUBLISHED', isActive: true },
            _min: { price: true },
            _max: { price: true }
        });

        return res.json({
            categories,
            priceRange: {
                min: priceAgg._min.price || 0,
                max: priceAgg._max.price || 100000
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Metadata alınamadı.' });
    }
};

const createProduct = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        const { name, slug, description, price, discountPrice, stock, categoryId, images, variants, metadata, sku } = req.body;

        const product = await prisma.product.create({
            data: {
                name,
                slug: slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                description,
                price: parseFloat(price),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                sku: sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                stock: parseInt(stock) || 0,
                categoryId,
                merchantId,
                status: req.body.status || 'DRAFT',
                isActive: true,
                metadata: metadata || {},
                images: {
                    create: (images || []).map(url => ({ url }))
                },
                variants: {
                    create: (variants || []).map(v => ({
                        name: v.name,
                        value: v.value,
                        price: parseFloat(v.price) || 0,
                        stock: parseInt(v.stock) || 0,
                        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
                    }))
                }
            },
            include: { images: true, variants: true }
        });

        return res.status(201).json(product);
    } catch (err) {
        console.error('[PRODUCT_CREATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Ürün oluşturulamadı.' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        const { id } = req.params;
        const { name, slug, description, price, discountPrice, stock, categoryId, images, variants, metadata, status, sku } = req.body;

        // Verify ownership
        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
        if (existing.merchantId !== merchantId) return res.status(403).json({ success: false, message: 'Bu ürünü düzenleme yetkiniz yok.' });

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                slug,
                description,
                price: parseFloat(price),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                sku: sku || existing.sku,
                stock: parseInt(stock) || 0,
                categoryId,
                status: status || existing.status,
                metadata: metadata || {},
                // Simple strategy: Replace images and variants if provided
                images: images ? {
                    deleteMany: {},
                    create: images.map(url => ({ url }))
                } : undefined,
                variants: variants ? {
                    deleteMany: {},
                    create: variants.map(v => ({
                        name: v.name,
                        value: v.value,
                        price: parseFloat(v.price) || 0,
                        stock: parseInt(v.stock) || 0,
                        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
                    }))
                } : undefined
            },
            include: { images: true, variants: true }
        });

        return res.json(product);
    } catch (err) {
        console.error('[PRODUCT_UPDATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Ürün güncellenemedi.' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        const { id } = req.params;

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
        if (existing.merchantId !== merchantId) return res.status(403).json({ success: false, message: 'Bu ürünü silme yetkiniz yok.' });

        await prisma.product.delete({ where: { id } });
        return res.json({ success: true, message: 'Ürün başarıyla silindi.' });
    } catch (err) {
        console.error('[PRODUCT_DELETE] Error:', err);
        return res.status(500).json({ success: false, message: 'Ürün silinemedi.' });
    }
};

const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isActive } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (isActive !== undefined) updateData.isActive = isActive;

        const product = await prisma.product.update({
            where: { id },
            data: updateData
        });

        return res.json({ success: true, product });
    } catch (err) {
        console.error('[PRODUCT_STATUS_UPDATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Ürün durumu güncellenemedi.' });
    }
};

const bulkUpdateStock = async (req, res) => {
    try {
        const merchantId = req.user.sub || req.user.id;
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ success: false, message: 'Geçersiz veri formatı.' });
        }

        // Perform stock updates in a prisma transaction with ownership check
        await prisma.$transaction(
            updates.map(update =>
                prisma.product.updateMany({
                    where: {
                        id: update.productId,
                        merchantId: merchantId
                    },
                    data: {
                        stock: parseInt(update.stock) || 0
                    }
                })
            )
        );

        return res.status(200).json({ success: true, message: 'Stoklar başarıyla güncellendi.' });
    } catch (err) {
        console.error('[BULK_STOCK_UPDATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Stok güncellemesi sırasında bir hata oluştu.' });
    }
};

module.exports = { getAllProducts, getProductById, getProductMeta, createProduct, updateProduct, deleteProduct, updateProductStatus, bulkUpdateStock };
