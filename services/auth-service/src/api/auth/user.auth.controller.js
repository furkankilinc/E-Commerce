const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const {
    generateAccessToken,
    generateRefreshToken,
    refreshTokenExpiryDate,
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

    return res.status(statusCode).json({
        success: true,
        message,
        user: {
            id: person.id,
            email: person.email,
            name: person.name,
            role: person.role || (audience === 'user' ? 'USER' : 'ADMIN')
        },
        accessToken
    });
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

module.exports = { userRegister, userLogin, adminLogin, merchantRegister, merchantLogin };
