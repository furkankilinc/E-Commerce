const { Router } = require('express');
const multer = require('multer');
const { uploadImage, deleteImage } = require('../../integrations/storage/upload.service');
const { verifyToken } = require('../../utils/token.util');

const router = Router();

// ── Auth Middleware ──────────────────────────────────────────────────────────
// Only authenticated merchants may upload or delete images.
const { authenticate } = require('../../middlewares/auth.middleware');

const uploadAuth = (req, res, next) => {
    // Try user auth first, then merchant
    authenticate('user')(req, res, (err) => {
        if (!err) return next();
        authenticate('merchant')(req, res, next);
    });
};

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

router.post('/', uploadAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) throw new Error('Resim dosyası seçilmedi.');
        const url = await uploadImage(req.file.buffer, req.file.originalname);
        res.json({ url, message: 'Resim güvenli bulundu ve WebP olarak yüklendi.' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/bulk', uploadAuth, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) throw new Error('Resim seçilmedi.');
        const urls = await Promise.all(req.files.map(f => uploadImage(f.buffer, f.originalname)));
        res.json({ urls, message: `${urls.length} resim başarıyla yüklendi.` });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/', uploadAuth, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) throw new Error('Silinecek resim URL\'i belirtilmedi.');
        await deleteImage(url);
        res.json({ message: 'Resim MinIO\'dan başarıyla silindi.' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

