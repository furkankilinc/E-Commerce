const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken, verifyToken, refreshTokenExpiry } = require('../../utils/token.util');

const prisma = new PrismaClient();
const router = Router();
const AUDIENCE = 'merchant';

// POST /api/auth/merchant/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, companyName, taxId, contactPerson, phone } = req.body;
        if (!email || !password || !companyName)
            return res.status(400).json({ message: 'Email, şifre ve şirket adı zorunludur.' });

        const existing = await prisma.merchant.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: 'Bu email zaten kayıtlı.' });

        const hashed = await bcrypt.hash(password, 12);
        const merchant = await prisma.merchant.create({
            data: { email, password: hashed, companyName, taxId, contactPerson, phone },
        });

        const payload = { sub: merchant.id, email: merchant.email, audience: AUDIENCE };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await prisma.merchantRefreshToken.create({
            data: {
                token: refreshToken, merchantId: merchant.id, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(201).json({
            message: 'Merchant kaydı başarılı. Hesabınız incelemeye alınmıştır.',
            accessToken, refreshToken,
            merchant: { id: merchant.id, email: merchant.email, companyName: merchant.companyName, isVerified: merchant.isVerified },
        });
    } catch (err) {
        console.error('[merchant/register]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/merchant/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email ve şifre zorunludur.' });

        const merchant = await prisma.merchant.findUnique({ where: { email } });
        if (!merchant || !merchant.isActive)
            return res.status(401).json({ message: 'Geçersiz kimlik bilgileri veya hesap aktif değil.' });

        const isMatch = await bcrypt.compare(password, merchant.password);
        if (!isMatch) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });

        const payload = { sub: merchant.id, email: merchant.email, audience: AUDIENCE };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await prisma.merchantRefreshToken.create({
            data: {
                token: refreshToken, merchantId: merchant.id, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(200).json({
            message: 'Giriş başarılı.',
            accessToken, refreshToken,
            merchant: { id: merchant.id, email: merchant.email, companyName: merchant.companyName, isVerified: merchant.isVerified },
        });
    } catch (err) {
        console.error('[merchant/login]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/merchant/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token gerekli.' });

        let payload;
        try { payload = verifyToken(refreshToken, AUDIENCE); }
        catch { return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' }); }

        const stored = await prisma.merchantRefreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.revoked || stored.expiresAt < new Date())
            return res.status(401).json({ message: 'Token geçersiz veya iptal edilmiş.' });

        await prisma.merchantRefreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

        const newPayload = { sub: payload.sub, email: payload.email, audience: AUDIENCE };
        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        await prisma.merchantRefreshToken.create({
            data: {
                token: newRefreshToken, merchantId: payload.sub, expiresAt: refreshTokenExpiry(),
                userAgent: req.headers['user-agent'], ipAddress: req.ip
            },
        });

        return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error('[merchant/refresh]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/auth/merchant/logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token gerekli.' });
        await prisma.merchantRefreshToken.updateMany({
            where: { token: refreshToken, revoked: false }, data: { revoked: true },
        });
        return res.status(200).json({ message: 'Çıkış başarılı.' });
    } catch (err) {
        console.error('[merchant/logout]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
