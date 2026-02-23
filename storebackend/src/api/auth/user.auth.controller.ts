import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiryDate,
} from '../../utils/token.util';

const AUDIENCE = 'user' as const;

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const userRegister = async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email ve şifre zorunludur.' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: 'Bu email zaten kayıtlı.' });
        }

        const hashed = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { email, password: hashed, name, phone },
        });

        const tokenPayload = { sub: user.id, email: user.email, audience: AUDIENCE };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Refresh token'ı DB'ye kaydet
        await prisma.userRefreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: refreshTokenExpiryDate(),
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
            },
        });

        return res.status(201).json({
            message: 'Kayıt başarılı.',
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, name: user.name },
        });
    } catch (err) {
        console.error('[user/register]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email ve şifre zorunludur.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });
        }

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

        return res.status(200).json({
            message: 'Giriş başarılı.',
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, name: user.name },
        });
    } catch (err) {
        console.error('[user/login]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const userRefresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token gerekli.' });
        }

        // Token imzasını doğrula
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken, AUDIENCE);
        } catch {
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
        }

        // DB'de geçerli mi?
        const stored = await prisma.userRefreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return res.status(401).json({ message: 'Token geçersiz veya iptal edilmiş.' });
        }

        // Eski token'ı iptal et (rotation)
        await prisma.userRefreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });

        // Yeni çift üret
        const tokenPayload = { sub: payload.sub, email: payload.email, audience: AUDIENCE };
        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        await prisma.userRefreshToken.create({
            data: {
                token: newRefreshToken,
                userId: payload.sub,
                expiresAt: refreshTokenExpiryDate(),
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
            },
        });

        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        console.error('[user/refresh]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const userLogout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token gerekli.' });
        }

        // Token'ı iptal et (soft delete)
        await prisma.userRefreshToken.updateMany({
            where: { token: refreshToken, revoked: false },
            data: { revoked: true },
        });

        return res.status(200).json({ message: 'Çıkış başarılı.' });
    } catch (err) {
        console.error('[user/logout]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
