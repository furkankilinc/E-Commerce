const { Router } = require('express');
const multer = require('multer');
const { uploadImage, deleteImage } = require('../../utils/upload.service');
const { authMiddleware, authorize } = require('../../middlewares/auth.middleware');

const router = Router();

// Multer config - memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        if (allowedTypes.test(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim dosyaları yüklenebilir.'));
    }
});

// POST /api/upload/bulk
router.post('/bulk', authMiddleware, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Resim seçilmedi.' });
        }
        
        const urls = await Promise.all(req.files.map(f => uploadImage(f.buffer, f.originalname)));
        return res.json({ 
            success: true, 
            urls, 
            message: `${urls.length} resim başarıyla yüklendi.` 
        });
    } catch (err) {
        console.error('[UPLOAD_BULK] Error:', err);
        return res.status(400).json({ success: false, message: err.message });
    }
});

// DELETE /api/upload
router.delete('/', authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, message: 'Silinecek resim URL\'i belirtilmedi.' });
        }
        await deleteImage(url);
        return res.json({ success: true, message: 'Resim MinIO\'dan başarıyla silindi.' });
    } catch (err) {
        console.error('[UPLOAD_DELETE] Error:', err);
        return res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
