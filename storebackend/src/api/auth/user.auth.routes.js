const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken, verifyToken, refreshTokenExpiry } = require('../../utils/token.util');

const prisma = new PrismaClient();
const router = Router();
const AUDIENCE = 'user';

// POST /api/auth/user/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email ve şifre zorunludur.' });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: 'Bu email zaten kayıtlı.' });

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({ data: { email, password: hashed, name, phone } });

        const payload = { sub: user.id, email: user.email, audience: AUDIENCE };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await prisma.userRefreshToken.create({
            data: {
                token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(201).json({
            message: 'Kayıt başarılı.',
            accessToken, refreshToken,
            user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
        });
    } catch (err) {
        console.error('[user/register]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/user/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email ve şifre zorunludur.' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });

        const payload = { sub: user.id, email: user.email, audience: AUDIENCE };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await prisma.userRefreshToken.create({
            data: {
                token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(200).json({
            message: 'Giriş başarılı.',
            accessToken, refreshToken,
            user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
        });
    } catch (err) {
        console.error('[user/login]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/user/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token gerekli.' });

        let payload;
        try { payload = verifyToken(refreshToken, AUDIENCE); }
        catch { return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' }); }

        const stored = await prisma.userRefreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return res.status(401).json({ message: 'Token geçersiz veya iptal edilmiş.' });
        }

        await prisma.userRefreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

        const newPayload = { sub: payload.sub, email: payload.email, audience: AUDIENCE };
        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        await prisma.userRefreshToken.create({
            data: {
                token: newRefreshToken, userId: payload.sub, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error('[user/refresh]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/user/logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token gerekli.' });
        await prisma.userRefreshToken.updateMany({
            where: { token: refreshToken, revoked: false }, data: { revoked: true },
        });
        return res.status(200).json({ message: 'Çıkış başarılı.' });
    } catch (err) {
        console.error('[user/logout]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
