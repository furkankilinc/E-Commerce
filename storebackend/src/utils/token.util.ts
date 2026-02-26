import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type TokenAudience = 'user' | 'merchant' | 'admin';

export interface AccessTokenPayload {
    sub: string;       // entity id
    email: string;
    audience: TokenAudience;
    role?: string;     // adminler için
    iat?: number;
    exp?: number;
}

/**
 * Her entity tipi için ayrı secret kullanılır.
 * Böylece bir kullanıcının tokeni merchant endpoint'te çalışmaz.
 */
const SECRETS: Record<TokenAudience, string> = {
    user: env.JWT_USER_SECRET,
    merchant: env.JWT_MERCHANT_SECRET,
    admin: env.JWT_ADMIN_SECRET,
};

export const generateAccessToken = (
    payload: Omit<AccessTokenPayload, 'iat' | 'exp'>,
): string => {
    const secret = SECRETS[payload.audience];
    const options: SignOptions = {
        expiresIn: '15m',   // Access token kısa ömürlü
    };
    return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (
    payload: Omit<AccessTokenPayload, 'iat' | 'exp'>,
): string => {
    const secret = SECRETS[payload.audience];
    const options: SignOptions = {
        expiresIn: '7d',    // Refresh token uzun ömürlü
    };
    return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (
    token: string,
    audience: TokenAudience,
): AccessTokenPayload => {
    const secret = SECRETS[audience];
    return jwt.verify(token, secret) as AccessTokenPayload;
};

export const verifyRefreshToken = (
    token: string,
    audience: TokenAudience,
): AccessTokenPayload => {
    const secret = SECRETS[audience];
    return jwt.verify(token, secret) as AccessTokenPayload;
};

/** Refresh token'ın DB'deki expiry tarihini hesapla (7 gün) */
export const refreshTokenExpiryDate = (): Date => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
};
