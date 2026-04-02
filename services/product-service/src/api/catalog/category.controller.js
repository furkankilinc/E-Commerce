const prisma = require('../../config/prisma');

const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { children: true }
        });
        return res.json(categories);
    } catch (err) {
        console.error('[CATEGORY] Error:', err.message, err.stack);
        return res.status(500).json({ success: false, message: 'Kategoriler yüklenemedi.', error: err.message });
    }
};

const getAllCategoriesAdmin = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { children: true, products: true }
                }
            }
        });
        return res.json(categories); // Frontend expects an array directly or success wrapper?
        // Let's check CategoriesPage.tsx: line 519: if (res.ok) setCategories(await res.json());
        // So just return the array.
    } catch (err) {
        console.error('[CATEGORY_ADMIN] Error:', err);
        return res.status(500).json({ success: false, message: 'Kategoriler yüklenemedi.' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, slug, description, parentId, isActive, filterValues } = req.body;
        
        const finalSlug = slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const category = await prisma.category.create({
            data: {
                name,
                slug: finalSlug,
                description,
                parentId: parentId || null,
                isActive: isActive !== undefined ? isActive : true,
                filterValues: filterValues || {}
            }
        });

        return res.status(201).json(category); // Frontend expects the object or success wrapper?
        // line 534: const json = await res.json(); if (!res.ok) throw new Error(json.message || 'Hata');
        // Seems it expects the object back.
    } catch (err) {
        console.error('[CATEGORY_CREATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Kategori oluşturulamadı.' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, parentId, isActive, filterValues } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                description,
                parentId: parentId || null,
                isActive,
                filterValues
            }
        });

        return res.json(category);
    } catch (err) {
        console.error('[CATEGORY_UPDATE] Error:', err);
        return res.status(500).json({ success: false, message: 'Kategori güncellenemedi.' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if has children or products
        const category = await prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { children: true, products: true } } }
        });

        if (!category) return res.status(404).json({ success: false, message: 'Kategori bulunamadı.' });

        if (category._count.children > 0) {
            return res.status(400).json({ success: false, message: 'Bu kategorinin alt kategorileri var, önce onları silmelisiniz.' });
        }

        // If has products, we might want to prevent deletion or just set isActive: false
        // But the frontend has a specific UI for this. Let's just delete if possible or handle error.
        await prisma.category.delete({ where: { id } });

        return res.json({ success: true, message: 'Kategori başarıyla silindi.' });
    } catch (err) {
        console.error('[CATEGORY_DELETE] Error:', err);
        return res.status(500).json({ success: false, message: 'Kategori silinemedi.' });
    }
};

module.exports = { getAllCategories, getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory };
