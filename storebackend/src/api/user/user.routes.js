const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../../utils/token.util');

const prisma = new PrismaClient();
const router = Router();

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        // Correcting function call from verifyAccessToken to verifyToken
        const payload = verifyToken(token, 'user');
        req.userId = payload.sub;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token geçersiz veya süresi dolmuş.' });
    }
};

// GET /api/user/me
router.get('/me', authenticateUser, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, name: true, phone: true }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// PUT /api/user/profile
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const { phone, email } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: { phone, email }
        });
        res.json({ message: 'Profil güncellendi', user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// POST /api/user/change-password
router.post('/change-password', authenticateUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.userId } });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Mevcut şifre hatalı.' });

        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: req.userId },
            data: { password: hashed }
        });

        res.json({ message: 'Şifre başarıyla değiştirildi.' });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
