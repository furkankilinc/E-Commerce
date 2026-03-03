const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiryDate,
} = require('../../utils/token.util');
const logger = require('../../utils/logger');

const AUDIENCE = 'merchant';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};

const sendMerchantAuthResponse = async (req, res, statusCode, merchant, message) => {
    const tokenPayload = { sub: merchant.id, email: merchant.email, audience: AUDIENCE };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.merchantRefreshToken.create({
        data: {
            token: refreshToken,
            merchantId: merchant.id,
            expiresAt: refreshTokenExpiryDate(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        },
    });

    res.cookie('merchant_accessToken', accessToken, { ...COOKIE_OPTIONS });
    res.cookie('merchant_refreshToken', refreshToken, { ...COOKIE_OPTIONS });

    return res.status(statusCode).json({
        success: true,
        message,
        merchant: {
            id: merchant.id,
            email: merchant.email,
            companyName: merchant.companyName,
            isVerified: merchant.isVerified,
            role: 'MERCHANT'
        },
        accessToken,
        refreshToken
    });
};

const merchantRegister = async (req, res) => {
    try {
        const { email, password, companyName, taxId, contactPerson, phone } = req.body;
        if (!email || !password || !companyName) {
            return res.status(400).json({ success: false, message: 'Email, şifre ve şirket adı zorunludur.' });
        }
        const existing = await prisma.merchant.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Bu email zaten kayıtlı.' });
        }
        const hashed = await bcrypt.hash(password, 12);
        const merchant = await prisma.merchant.create({
            data: { email, password: hashed, companyName, taxId, contactPerson, phone },
        });
        logger.info(`[AUTH/MERCHANT] New registration: ${merchant.email}`, { ip: req.ip });
        return sendMerchantAuthResponse(req, res, 201, merchant, 'Merchant kaydı başarılı.');
    } catch (err) {
        logger.error('[AUTH/MERCHANT] Register error:', err);
        return res.status(500).json({ success: false, message: 'Kayıt işlemi başarısız.' });
    }
};

const merchantLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email ve şifre zorunludur.' });
        }
        const merchant = await prisma.merchant.findUnique({ where: { email } });
        if (!merchant || !merchant.isActive) {
            return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri.' });
        }
        const isMatch = await bcrypt.compare(password, merchant.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri.' });
        }
        logger.info(`[AUTH/MERCHANT] Login successful: ${merchant.email}`);
        return sendMerchantAuthResponse(req, res, 200, merchant, 'Giriş başarılı.');
    } catch (err) {
        logger.error('[AUTH/MERCHANT] Login error:', err);
        return res.status(500).json({ success: false, message: 'Giriş işlemi başarısız.' });
    }
};

const merchantRefresh = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.merchant_refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token gerekli.' });
        }
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken, AUDIENCE);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Oturum süresi dolmuş.' });
        }
        const stored = await prisma.merchantRefreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'Geçersiz oturum.' });
        }
        await prisma.merchantRefreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });
        const merchant = await prisma.merchant.findUnique({ where: { id: payload.sub } });
        if (!merchant) {
            return res.status(404).json({ success: false, message: 'Merchant bulunamadı.' });
        }
        return sendMerchantAuthResponse(req, res, 200, merchant, 'Oturum yenilendi.');
    } catch (err) {
        logger.error('[AUTH/MERCHANT] Refresh error:', err);
        return res.status(500).json({ success: false, message: 'Yenileme işlemi başarısız.' });
    }
};

const merchantGetMe = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Lütfen giriş yapın.' });
        const merchant = await prisma.merchant.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, companyName: true, isVerified: true, createdAt: true }
        });
        return res.status(200).json({ success: true, merchant: { ...merchant, role: 'MERCHANT' } });
    } catch (err) {
        logger.error('[AUTH/MERCHANT] GetMe error:', err);
        return res.status(500).json({ success: false, message: 'Profil bilgileri alınamadı.' });
    }
};

const merchantLogout = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.merchant_refreshToken;
        if (refreshToken) {
            await prisma.merchantRefreshToken.updateMany({
                where: { token: refreshToken, revoked: false },
                data: { revoked: true },
            });
        }
        res.clearCookie('merchant_accessToken', COOKIE_OPTIONS);
        res.clearCookie('merchant_refreshToken', COOKIE_OPTIONS);
        return res.status(200).json({ success: true, message: 'Çıkış başarılı.' });
    } catch (err) {
        logger.error('[AUTH/MERCHANT] Logout error:', err);
        return res.status(500).json({ success: false, message: 'Çıkış işlemi başarısız.' });
    }
};

module.exports = {
    merchantRegister,
    merchantLogin,
    merchantRefresh,
    merchantGetMe,
    merchantLogout
};
