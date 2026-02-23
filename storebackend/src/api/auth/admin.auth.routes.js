const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken, verifyToken, refreshTokenExpiry } = require('../../utils/token.util');

const prisma = new PrismaClient();
const router = Router();
const AUDIENCE = 'admin';

/** Middleware: Bearer token'ı doğrula ve admin audience'ını kontrol et */
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı.' });

    try {
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token, AUDIENCE);
        req.adminPayload = payload;
        next();
    } catch {
        return res.status(401).json({ message: 'Token geçersiz veya süresi dolmuş.' });
    }
};

// POST /api/auth/admin/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email ve şifre zorunludur.' });

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || !admin.isActive)
            return res.status(401).json({ message: 'Geçersiz kimlik bilgileri veya hesap aktif değil.' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });

        await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

        const payload = { sub: admin.id, email: admin.email, audience: AUDIENCE, role: admin.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await prisma.adminRefreshToken.create({
            data: {
                token: refreshToken, adminId: admin.id, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(200).json({
            message: 'Giriş başarılı.',
            accessToken, refreshToken,
            admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
        });
    } catch (err) {
        console.error('[admin/login]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/admin/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token gerekli.' });

        let payload;
        try { payload = verifyToken(refreshToken, AUDIENCE); }
        catch { return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' }); }

        const stored = await prisma.adminRefreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.revoked || stored.expiresAt < new Date())
            return res.status(401).json({ message: 'Token geçersiz veya iptal edilmiş.' });

        await prisma.adminRefreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

        const newPayload = { sub: payload.sub, email: payload.email, audience: AUDIENCE, role: payload.role };
        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        await prisma.adminRefreshToken.create({
            data: {
                token: newRefreshToken, adminId: payload.sub, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error('[admin/refresh]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/admin/logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token gerekli.' });
        await prisma.adminRefreshToken.updateMany({
            where: { token: refreshToken, revoked: false }, data: { revoked: true },
        });
        return res.status(200).json({ message: 'Çıkış başarılı.' });
    } catch (err) {
        console.error('[admin/logout]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/admin/create  → Sadece SUPER_ADMIN erişebilir
router.post('/create', authenticateAdmin, async (req, res) => {
    try {
        if (req.adminPayload?.role !== 'SUPER_ADMIN')
            return res.status(403).json({ message: 'Bu işlem için SUPER_ADMIN yetkisi gereklidir.' });

        const { email, password, name, role } = req.body;
        if (!email || !password || !name)
            return res.status(400).json({ message: 'Email, şifre ve isim zorunludur.' });

        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: 'Bu email zaten kayıtlı.' });

        const hashed = await bcrypt.hash(password, 14);
        const admin = await prisma.admin.create({
            data: { email, password: hashed, name, role: role ?? 'ADMIN' },
        });

        return res.status(201).json({
            message: 'Admin oluşturuldu.',
            admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
        });
    } catch (err) {
        console.error('[admin/create]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
