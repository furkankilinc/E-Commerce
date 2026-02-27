import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { generateAccessToken, generateRefreshToken } from '../../utils/token.util';
const logger = require('../../utils/logger');

/**
 * Cookie Configuration
 */
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (Refresh Token duration)
};

/**
 * Helper to set cookies and send response
 */
const sendAuthResponse = (res: Response, statusCode: number, user: any, message: string) => {
    // Storefront users don't have roles in DB, default to 'USER'
    const role = 'USER';

    const accessToken = generateAccessToken({
        sub: user.id,
        email: user.email,
        audience: 'user',
        role: role
    });

    const refreshToken = generateRefreshToken({
        sub: user.id,
        email: user.email,
        audience: 'user',
        role: role
    });

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(statusCode).json({
        success: true,
        message,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: role
        },
        accessToken // Still return token for clients that prefer headers
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Bu e-posta adresi zaten kullanımda.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        logger.info(`[AUTH] New user registered: ${user.email}`);
        return sendAuthResponse(res, 201, user, 'Kayıt başarılı.');
    } catch (error: any) {
        logger.error('[AUTH] Register error:', error);
        return res.status(500).json({ success: false, message: 'Kayıt sırasında bir hata oluştu.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' });
        }

        logger.info(`[AUTH] User logged in: ${user.email}`);
        return sendAuthResponse(res, 200, user, 'Giriş başarılı.');
    } catch (error: any) {
        logger.error('[AUTH] Login error:', error);
        return res.status(500).json({ success: false, message: 'Giriş sırasında bir hata oluştu.' });
    }
};

/**
 * Get Current User Profile
 */
export const getMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Oturum bulunamadı.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, name: true, createdAt: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        return res.status(200).json({
            success: true,
            user: { ...user, role: 'USER' }
        });
    } catch (error: any) {
        logger.error('[AUTH] GetMe error:', error);
        return res.status(500).json({ success: false, message: 'Profil bilgileri alınamadı.' });
    }
};

/**
 * Logout - Clear Cookies
 */
export const logout = (req: Request, res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Çıkış yapıldı.' });
};

