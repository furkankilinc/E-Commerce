const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiryDate,
} = require('../../utils/token.util');
const logger = require('../../utils/logger');

const AUDIENCE = 'user';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};

const sendUserAuthResponse = async (req, res, statusCode, user, message) => {
    const tokenPayload = { sub: user.id, email: user.email, audience: AUDIENCE };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.userRefreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: refreshTokenExpiryDate(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        },
    });

    res.cookie('user_accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('user_refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(statusCode).json({
        success: true,
        message,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'USER'
        },
        accessToken
    });
};

const userRegister = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email ve şifre zorunludur.' });
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Bu email zaten kayıtlı.' });
        }
        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, password: hashed, name, phone },
        });
        logger.info(`[AUTH/USER] New registration: ${user.email}`, { ip: req.ip });
        return sendUserAuthResponse(req, res, 201, user, 'Kayıt başarılı.');
    } catch (err) {
        logger.error('[AUTH/USER] Register error:', err);
        return res.status(500).json({ success: false, message: 'Kayıt işlemi başarısız.' });
    }
};

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email ve şifre zorunludur.' });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri.' });
        }
        logger.info(`[AUTH/USER] Login successful: ${user.email}`, { ip: req.ip });
        return sendUserAuthResponse(req, res, 200, user, 'Giriş başarılı.');
    } catch (err) {
        logger.error('[AUTH/USER] Login error:', err);
        return res.status(500).json({ success: false, message: 'Giriş işlemi başarısız.' });
    }
};

const userRefresh = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token gerekli.' });
        }
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken, AUDIENCE);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Oturum süresi dolmuş.' });
        }
        const stored = await prisma.userRefreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'Geçersiz oturum.' });
        }
        await prisma.userRefreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }
        logger.info(`[AUTH/USER] Token refreshed for: ${user.email}`);
        return sendUserAuthResponse(req, res, 200, user, 'Oturum yenilendi.');
    } catch (err) {
        logger.error('[AUTH/USER] Refresh error:', err);
        return res.status(500).json({ success: false, message: 'Yenileme işlemi başarısız.' });
    }
};

const userGetMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Lütfen giriş yapın.' });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, name: true, phone: true, createdAt: true }
        });
        return res.status(200).json({ success: true, user: { ...user, role: 'USER' } });
    } catch (err) {
        logger.error('[AUTH/USER] GetMe error:', err);
        return res.status(500).json({ success: false, message: 'Profil bilgileri alınamadı.' });
    }
};

const userLogout = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        if (refreshToken) {
            await prisma.userRefreshToken.updateMany({
                where: { token: refreshToken, revoked: false },
                data: { revoked: true },
            });
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(200).json({ success: true, message: 'Çıkış başarılı.' });
    } catch (err) {
        logger.error('[AUTH/USER] Logout error:', err);
        return res.status(500).json({ success: false, message: 'Çıkış işlemi sırasında bir hata oluştu.' });
    }
};

const updateUserLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (!req.user) return res.status(401).json({ success: false, message: 'Giriş gerekli.' });

        await prisma.user.update({
            where: { id: req.user.sub },
            data: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                lastActiveAt: new Date()
            }
        });

        return res.status(200).json({ success: true, message: 'Konum güncellendi.' });
    } catch (err) {
        logger.error('[AUTH/USER] Update location error:', err);
        return res.status(500).json({ success: false, message: 'Konum güncellenemedi.' });
    }
};

module.exports = {
    userRegister,
    userLogin,
    userRefresh,
    userGetMe,
    userLogout,
    updateUserLocation
};
