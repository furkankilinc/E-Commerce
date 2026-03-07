import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiryDate,
} from '../../utils/token.util';
const logger = require('../../utils/logger');

const AUDIENCE = 'merchant' as const;

/**
 * Cookie Configuration
 */
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
};

/**
 * Standard Success Response with Cookies
 */
const sendMerchantAuthResponse = async (req: Request, res: Response, statusCode: number, merchant: any, message: string) => {
    const tokenPayload = { sub: merchant.id, email: merchant.email, audience: AUDIENCE };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Persist Refresh Token in DB
    await prisma.merchantRefreshToken.create({
        data: {
            token: refreshToken,
            merchantId: merchant.id,
            expiresAt: refreshTokenExpiryDate(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        },
    });

    // Set Cookies
    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

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
        accessToken
    });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const merchantRegister = async (req: Request, res: Response) => {
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

        logger.info(`[AUTH/MERCHANT] New registration: ${merchant.email}`, { company: companyName });
        return sendMerchantAuthResponse(req, res, 201, merchant, 'Merchant kaydı başarılı. Doğrulama bekleniyor.');
    } catch (err: any) {
        logger.error('[AUTH/MERCHANT] Register error:', err);
        return res.status(500).json({ success: false, message: 'Kayıt işlemi başarısız.' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const merchantLogin = async (req: Request, res: Response) => {
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
    } catch (err: any) {
        logger.error('[AUTH/MERCHANT] Login error:', err);
        return res.status(500).json({ success: false, message: 'Giriş işlemi başarısız.' });
    }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const merchantRefresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token gerekli.' });
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken, AUDIENCE);
        } catch {
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
        if (!merchant) return res.status(404).json({ success: false, message: 'Merchant bulunamadı.' });

        return sendMerchantAuthResponse(req, res, 200, merchant, 'Oturum yenilendi.');
    } catch (err: any) {
        logger.error('[AUTH/MERCHANT] Refresh error:', err);
        return res.status(500).json({ success: false, message: 'Yenileme işlemi başarısız.' });
    }
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const merchantGetMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Lütfen giriş yapın.' });

        const merchant = await prisma.merchant.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, companyName: true, isVerified: true, createdAt: true }
        });

        return res.status(200).json({ success: true, merchant: { ...merchant, role: 'MERCHANT' } });
    } catch (err: any) {
        logger.error('[AUTH/MERCHANT] GetMe error:', err);
        return res.status(500).json({ success: false, message: 'Profil bilgileri alınamadı.' });
    }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const merchantLogout = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        if (refreshToken) {
            await prisma.merchantRefreshToken.updateMany({
                where: { token: refreshToken, revoked: false },
                data: { revoked: true },
            });
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(200).json({ success: true, message: 'Çıkış başarılı.' });
    } catch (err: any) {
        logger.error('[AUTH/MERCHANT] Logout error:', err);
        return res.status(500).json({ success: false, message: 'Çıkış işlemi başarısız.' });
    }
};
