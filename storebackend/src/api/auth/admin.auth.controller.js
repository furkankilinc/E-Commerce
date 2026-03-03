const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiryDate,
} = require('../../utils/token.util');
const logger = require('../../utils/logger');

const AUDIENCE = 'admin';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};

const sendAdminAuthResponse = async (req, res, statusCode, admin, message) => {
    const tokenPayload = {
        sub: admin.id,
        email: admin.email,
        audience: AUDIENCE,
        role: admin.role
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.adminRefreshToken.create({
        data: {
            token: refreshToken,
            adminId: admin.id,
            expiresAt: refreshTokenExpiryDate(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        },
    });

    res.cookie('admin_accessToken', accessToken, { ...COOKIE_OPTIONS });
    res.cookie('admin_refreshToken', refreshToken, { ...COOKIE_OPTIONS });

    return res.status(statusCode).json({
        success: true,
        message,
        admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role
        },
        accessToken,
        refreshToken
    });
};

const adminCreate = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Email, şifre ve isim zorunludur.' });
        }
        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Bu email zaten kayıtlı.' });
        }
        const hashed = await bcrypt.hash(password, 14);
        const admin = await prisma.admin.create({
            data: { email, password: hashed, name, role: role || 'ADMIN' },
        });
        return res.status(201).json({ success: true, message: 'Admin oluşturuldu.', admin });
    } catch (err) {
        logger.error('[AUTH/ADMIN] Create error:', err);
        return res.status(500).json({ success: false, message: 'Admin oluşturulamadı.' });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email ve şifre zorunludur.' });
        }
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri.' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri.' });
        }
        await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });
        logger.info(`[AUTH/ADMIN] Login successful: ${admin.email}`);
        return sendAdminAuthResponse(req, res, 200, admin, 'Giriş başarılı.');
    } catch (err) {
        logger.error('[AUTH/ADMIN] Login error:', err);
        return res.status(500).json({ success: false, message: 'Giriş başarısız.' });
    }
};

const adminRefresh = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.admin_refreshToken;
        if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token gerekli.' });
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken, AUDIENCE);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Oturum süresi dolmuş.' });
        }
        const stored = await prisma.adminRefreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'Geçersiz oturum.' });
        }
        await prisma.adminRefreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });
        const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
        if (!admin) return res.status(404).json({ success: false, message: 'Admin bulunamadı.' });
        return sendAdminAuthResponse(req, res, 200, admin, 'Oturum yenilendi.');
    } catch (err) {
        logger.error('[AUTH/ADMIN] Refresh error:', err);
        return res.status(500).json({ success: false, message: 'Yenileme başarısız.' });
    }
};

const adminGetMe = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Lütfen giriş yapın.' });
        const admin = await prisma.admin.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, name: true, role: true, lastLoginAt: true }
        });
        return res.status(200).json({ success: true, admin });
    } catch (err) {
        logger.error('[AUTH/ADMIN] GetMe error:', err);
        return res.status(500).json({ success: false, message: 'Profil alınamadı.' });
    }
};

const adminLogout = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.admin_refreshToken;
        if (refreshToken) {
            await prisma.adminRefreshToken.updateMany({
                where: { token: refreshToken, revoked: false },
                data: { revoked: true },
            });
        }
        res.clearCookie('admin_accessToken', COOKIE_OPTIONS);
        res.clearCookie('admin_refreshToken', COOKIE_OPTIONS);
        return res.status(200).json({ success: true, message: 'Çıkış başarılı.' });
    } catch (err) {
        logger.error('[AUTH/ADMIN] Logout error:', err);
        return res.status(500).json({ success: false, message: 'Çıkış başarısız.' });
    }
};

module.exports = {
    adminCreate,
    adminLogin,
    adminRefresh,
    adminGetMe,
    adminLogout
};
