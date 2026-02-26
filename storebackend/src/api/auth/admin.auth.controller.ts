import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiryDate,
} from '../../utils/token.util';

const AUDIENCE = 'admin' as const;

/**
 * Admin kaydı sadece veritabanından (seed/script) yapılır.
 * Burası güvenlik nedeniyle açık değil — yalnızca SUPER_ADMIN
 * başka bir admin oluşturabilir. Bu endpoint ayrıca korunmalıdır.
 */
export const adminCreate = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Email, şifre ve isim zorunludur.' });
        }

        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: 'Bu email zaten kayıtlı.' });
        }

        const hashed = await bcrypt.hash(password, 14); // Admin için daha yüksek round

        const admin = await prisma.admin.create({
            data: { email, password: hashed, name, role: role ?? 'ADMIN' },
        });

        return res.status(201).json({
            message: 'Admin oluşturuldu.',
            admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
        });
    } catch (err) {
        console.error('[admin/create]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email ve şifre zorunludur.' });
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || !admin.isActive) {
            return res.status(401).json({ message: 'Geçersiz kimlik bilgileri veya hesap aktif değil.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });
        }

        // Son giriş zamanını güncelle
        await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });

        const tokenPayload = {
            sub: admin.id,
            email: admin.email,
            audience: AUDIENCE,
            role: admin.role,
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

        return res.status(200).json({
            message: 'Giriş başarılı.',
            accessToken,
            refreshToken,
            admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
        });
    } catch (err) {
        console.error('[admin/login]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const adminRefresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token gerekli.' });
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken, AUDIENCE);
        } catch {
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
        }

        const stored = await prisma.adminRefreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return res.status(401).json({ message: 'Token geçersiz veya iptal edilmiş.' });
        }

        // Token rotation
        await prisma.adminRefreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });

        const tokenPayload = {
            sub: payload.sub,
            email: payload.email,
            audience: AUDIENCE,
            role: payload.role,
        };
        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        await prisma.adminRefreshToken.create({
            data: {
                token: newRefreshToken,
                adminId: payload.sub,
                expiresAt: refreshTokenExpiryDate(),
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
            },
        });

        return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error('[admin/refresh]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const adminLogout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token gerekli.' });
        }

        await prisma.adminRefreshToken.updateMany({
            where: { token: refreshToken, revoked: false },
            data: { revoked: true },
        });

        return res.status(200).json({ message: 'Çıkış başarılı.' });
    } catch (err) {
        console.error('[admin/logout]', err);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
