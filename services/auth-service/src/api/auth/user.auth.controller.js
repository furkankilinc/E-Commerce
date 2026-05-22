const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const {
    generateAccessToken,
    generateRefreshToken,
    refreshTokenExpiryDate,
    verifyRefreshToken,
} = require('../../utils/token.util');

const AUDIENCE = 'user';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
};

const sendAuthResponse = async (req, res, statusCode, person, message, audience) => {
    const tokenPayload = { sub: person.id, email: person.email, audience: audience };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Her rolün kendi RefreshToken tablosu var
    if (audience === 'user') {
        await prisma.userRefreshToken.create({
            data: { token: refreshToken, userId: person.id, expiresAt: refreshTokenExpiryDate(), userAgent: req.headers['user-agent'], ipAddress: req.ip },
        });
    } else if (audience === 'admin') {
        await prisma.adminRefreshToken.create({
            data: { token: refreshToken, adminId: person.id, expiresAt: refreshTokenExpiryDate(), userAgent: req.headers['user-agent'], ipAddress: req.ip },
        });
    } else if (audience === 'merchant') {
        console.log('[DEBUG] Creating MerchantRefreshToken for:', person.id);
        await prisma.merchantRefreshToken.create({
            data: { token: refreshToken, merchantId: person.id, expiresAt: refreshTokenExpiryDate(), userAgent: req.headers['user-agent'], ipAddress: req.ip },
        });
    }

    res.cookie(`${audience}_accessToken`, accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie(`${audience}_refreshToken`, refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    const responsePayload = {
        success: true,
        message,
        user: {
            id: person.id,
            email: person.email,
            name: audience === 'merchant' ? (person.companyName || person.contactPerson) : person.name,
            role: audience === 'merchant' ? 'MERCHANT' : (person.role || (audience === 'user' ? 'USER' : 'ADMIN'))
        },
        accessToken,
        refreshToken
    };

    if (audience === 'merchant') {
        responsePayload.merchant = {
            id: person.id,
            email: person.email,
            companyName: person.companyName,
            contactPerson: person.contactPerson,
            isVerified: person.isVerified || false
        };
    }

    return res.status(statusCode).json(responsePayload);
};

const userRegister = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(409).json({ success: false, message: 'Bu email zaten kayıtlı.' });

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, password: hashed, name, phone },
        });
        return sendAuthResponse(req, res, 201, user, 'Kayıt başarılı.', 'user');
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Kayıt başarısız.' });
    }
};

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Geçersiz bilgiler.' });
        }
        return sendAuthResponse(req, res, 200, user, 'Giriş başarılı.', 'user');
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Hata oluştu.' });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim.' });
        }
        return sendAuthResponse(req, res, 200, admin, 'Admin girişi başarılı.', 'admin');
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Giriş işlemi başarısız.' });
    }
};

const merchantRegister = async (req, res) => {
    try {
        const { email, password, companyName, contactPerson, phone } = req.body;
        const exists = await prisma.merchant.findUnique({ where: { email } });
        if (exists) return res.status(409).json({ success: false, message: 'Bu email zaten kayıtlı.' });

        const hashed = await bcrypt.hash(password, 12);
        const merchant = await prisma.merchant.create({
            data: { email, password: hashed, companyName, contactPerson, phone },
        });
        return sendAuthResponse(req, res, 201, merchant, 'Kayıt başarılı.', 'merchant');
    } catch (err) {
        console.error('[MERCHANT_REGISTER] ERROR:', err);
        return res.status(500).json({ success: false, message: 'Kayıt başarısız: ' + err.message });
    }
};

const merchantLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('[MERCHANT_LOGIN] Start for:', email);

        const merchant = await prisma.merchant.findUnique({ where: { email } });
        if (!merchant) {
            console.log('[MERCHANT_LOGIN] No merchant with email:', email);
            return res.status(401).json({ success: false, message: 'Geçersiz bilgiler.' });
        }

        const isMatch = await bcrypt.compare(password, merchant.password);
        if (!isMatch) {
            console.log('[MERCHANT_LOGIN] Password mismatch for:', email);
            return res.status(401).json({ success: false, message: 'Geçersiz bilgiler.' });
        }

        return sendAuthResponse(req, res, 200, merchant, 'Giriş başarılı.', 'merchant');
    } catch (err) {
        console.error('[MERCHANT_LOGIN] FATAL:', err.message, err.stack);
        return res.status(500).json({ success: false, message: 'Hata oluştu: ' + err.message });
    }
};

const refreshSession = async (req, res, audience) => {
    try {
        let token = req.body.refreshToken || req.cookies[`${audience}_refreshToken`];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Refresh token bulunamadı.' });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Geçersiz veya süresi geçmiş refresh token.' });
        }

        if (decoded.audience !== audience) {
            return res.status(401).json({ success: false, message: 'Yetkisiz token tipi.' });
        }

        let dbSession;
        if (audience === 'user') {
            dbSession = await prisma.userRefreshToken.findUnique({ where: { token } });
        } else if (audience === 'admin') {
            dbSession = await prisma.adminRefreshToken.findUnique({ where: { token } });
        } else if (audience === 'merchant') {
            dbSession = await prisma.merchantRefreshToken.findUnique({ where: { token } });
        }

        if (!dbSession || new Date(dbSession.expiresAt) < new Date()) {
            return res.status(401).json({ success: false, message: 'Süresi geçmiş veya geçersiz oturum.' });
        }

        // Delete old token for rotation
        if (audience === 'user') {
            await prisma.userRefreshToken.delete({ where: { token } });
        } else if (audience === 'admin') {
            await prisma.adminRefreshToken.delete({ where: { token } });
        } else if (audience === 'merchant') {
            await prisma.merchantRefreshToken.delete({ where: { token } });
        }

        let person;
        if (audience === 'user') {
            person = await prisma.user.findUnique({ where: { id: decoded.sub } });
        } else if (audience === 'admin') {
            person = await prisma.admin.findUnique({ where: { id: decoded.sub } });
        } else if (audience === 'merchant') {
            person = await prisma.merchant.findUnique({ where: { id: decoded.sub } });
        }

        if (!person) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        return sendAuthResponse(req, res, 200, person, 'Token başarıyla yenilendi.', audience);
    } catch (err) {
        console.error(`[REFRESH_${audience.toUpperCase()}] Error:`, err);
        return res.status(500).json({ success: false, message: 'Token yenileme işlemi başarısız.' });
    }
};

const userRefresh = (req, res) => refreshSession(req, res, 'user');
const merchantRefresh = (req, res) => refreshSession(req, res, 'merchant');
const adminRefresh = (req, res) => refreshSession(req, res, 'admin');

const getPublicMerchants = async (req, res) => {
    try {
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true },
            select: { id: true, companyName: true }
        });
        return res.json(merchants);
    } catch (err) {
        console.error('[GET_PUBLIC_MERCHANTS] Error:', err);
        return res.status(500).json({ success: false, message: 'Satıcılar alınamadı.' });
    }
};

module.exports = { userRegister, userLogin, adminLogin, merchantRegister, merchantLogin, userRefresh, merchantRefresh, adminRefresh, getPublicMerchants };
