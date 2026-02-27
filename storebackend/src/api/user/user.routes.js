const { Router } = require('express');
const dns = require('dns').promises;
const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middlewares/auth.middleware');

const prisma = new PrismaClient();
const router = Router();

/**
 * Standard Auth Error Helper
 */
const sendError = (res, status, message) => {
    return res.status(status).json({ success: false, message });
};

// GET /api/user/me
router.get('/me', authenticate('user'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, name: true, phone: true }
        });
        if (!user) return sendError(res, 404, 'Kullanıcı bulunamadı.');
        res.json({ success: true, user });
    } catch (err) {
        logger.error('[USER/PROFILE] Get profile error:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// PUT /api/user/profile
router.put('/profile', authenticate('user'), async (req, res) => {
    try {
        const { phone, email, name } = req.body;

        if (email) {
            const domain = email.split('@')[1];
            try {
                const mxRecords = await dns.resolveMx(domain);
                if (!mxRecords || mxRecords.length === 0) {
                    return sendError(res, 400, 'Geçersiz e-posta domaini.');
                }
            } catch (dnsErr) {
                return sendError(res, 400, 'E-posta doğrulanamadı.');
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.sub },
            data: { phone, email, name }
        });

        res.json({ success: true, message: 'Profil güncellendi', user: updatedUser });
    } catch (err) {
        logger.error('[USER/PROFILE] Update profile error:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// POST /api/user/change-password
router.post('/change-password', authenticate('user'), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return sendError(res, 400, 'Mevcut şifre hatalı.');

        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: req.user.sub },
            data: { password: hashed }
        });

        res.json({ success: true, message: 'Şifre başarıyla değiştirildi.' });
    } catch (err) {
        logger.error('[USER/PROFILE] Change password error:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

module.exports = router;
