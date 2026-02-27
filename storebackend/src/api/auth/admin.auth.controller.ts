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

const AUDIENCE = 'admin' as const;

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
const sendAdminAuthResponse = async (req: Request, res: Response, statusCode: number, admin: any, message: string) => {
    const tokenPayload = {
        sub: admin.id,
        email: admin.email,
        audience: AUDIENCE,
        role: admin.role
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Persist Refresh Token in DB
    await prisma.adminRefreshToken.create({
        data: {
            token: refreshToken,
            adminId: admin.id,
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
        admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role
        },
        accessToken
    });
};

/**
 * Admin Creation (Protected)
 */
export const adminCreate = async (req: Request, res: Response) => {
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
            data: { email, password: hashed, name, role: role ?? 'ADMIN' },
        });

        logger.info(`[AUTH/ADMIN] New admin created by ${req.user?.email || 'SYSTEM'}: ${admin.email}`);
        return res.status(201).json({ success: true, message: 'Admin oluşturuldu.', admin });
    } catch (err: any) {
        logger.error('[AUTH/ADMIN] Create error:', err);
        return res.status(500).json({ success: false, message: 'Admin oluşturulamadı.' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response) => {
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
    } catch (err: any) {
        logger.error('[AUTH/ADMIN] Login error:', err);
        return res.status(500).json({ success: false, message: 'Giriş başarısız.' });
    }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const adminRefresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token gerekli.' });

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken, AUDIENCE);
        } catch {
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
    } catch (err: any) {
        logger.error('[AUTH/ADMIN] Refresh error:', err);
        return res.status(500).json({ success: false, message: 'Yenileme başarısız.' });
    }
};

/**
 * Admin Profile
 */
export const adminGetMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Lütfen giriş yapın.' });

        const admin = await prisma.admin.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, name: true, role: true, lastLoginAt: true }
        });

        return res.status(200).json({ success: true, admin });
    } catch (err: any) {
        logger.error('[AUTH/ADMIN] GetMe error:', err);
        return res.status(500).json({ success: false, message: 'Profil alınamadı.' });
    }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const adminLogout = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        if (refreshToken) {
            await prisma.adminRefreshToken.updateMany({
                where: { token: refreshToken, revoked: false },
                data: { revoked: true },
            });
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(200).json({ success: true, message: 'Çıkış başarılı.' });
    } catch (err: any) {
        logger.error('[AUTH/ADMIN] Logout error:', err);
        return res.status(500).json({ success: false, message: 'Çıkış başarısız.' });
    }
};

