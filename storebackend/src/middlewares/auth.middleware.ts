import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenAudience, AccessTokenPayload } from '../utils/token.util';
const logger = require('../utils/logger');

/**
 * Enhanced Express Request interface with type-safe user context.
 */
declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenPayload;
            isFullyAuthenticated?: boolean;
        }
    }
}

/**
 * Standard Auth Error Responses for consistency
 */
const sendAuthError = (res: Response, status: number, code: string, message: string, detail?: any) => {
    return res.status(status).json({
        success: false,
        error: {
            code,
            message,
            detail
        }
    });
};

/**
 * Premium Authentication Middleware Factory
 * Handles multiple audiences, extracts tokens from dual sources (Cookies/Headers),
 * and performs strict validation.
 * 
 * @param allowedAudience - The target group (user, merchant, admin)
 */
export const authenticate = (allowedAudience: TokenAudience) => {
    return (req: Request, res: Response, next: NextFunction) => {
        let token: string | undefined;

        // 1. Try Extracting Token from Authorization Header (Bearer)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // 2. Fallback to HttpOnly Cookies if Header is missing
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            logger.warn(`[AUTH] Access denied: No token provided for ${allowedAudience} route.`, {
                ip: req.ip,
                path: req.originalUrl,
                method: req.method
            });
            return sendAuthError(res, 401, 'MISSING_TOKEN', 'Lütfen giriş yapın.');
        }

        try {
            // 3. Verify Token using the audience-specific secret
            const payload = verifyAccessToken(token, allowedAudience);

            // 4. Identity Mapping
            req.user = payload;
            req.isFullyAuthenticated = true;

            // 5. Success Audit Log (Optional, logic can be simplified for performance)
            // logger.info(`[AUTH] User authenticated: ${payload.sub} (${allowedAudience})`);

            next();
        } catch (err: any) {
            const isExpired = err.name === 'TokenExpiredError';

            logger.error(`[AUTH] Token validation failed: ${err.message}`, {
                error: err.name,
                audience: allowedAudience,
                path: req.originalUrl
            });

            return sendAuthError(
                res,
                401,
                isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
                isExpired ? 'Oturum süreniz doldu, lütfen tekrar giriş yapın.' : 'Geçersiz yetki anahtarı.'
            );
        }
    };
};

/**
 * Granular Role Check Middleware
 * Should be used AFTER authenticate() middleware.
 * Supports multiple roles (OR condition).
 * 
 * @param allowedRoles - List of roles that can access the path
 */
export const requireRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendAuthError(res, 401, 'UNAUTHORIZED', 'Kimlik doğrulaması gerekli.');
        }

        const userRole = req.user.role || 'GUEST';
        const hasAccess = allowedRoles.includes(userRole);

        if (!hasAccess) {
            logger.warn(`[AUTH] Access forbidden: Role mismatch for user ${req.user.sub}.`, {
                userRole,
                allowedRoles,
                path: req.originalUrl
            });

            return sendAuthError(
                res,
                403,
                'FORBIDDEN',
                'Bu işlem için yetkiniz bulunmamaktadır.',
                { required: allowedRoles, current: userRole }
            );
        }

        next();
    };
};

/**
 * SuperAdmin Shortcut
 */
export const requireSuperAdmin = requireRoles('SUPER_ADMIN');

/**
 * Merchant Owner Shortcut
 */
export const requireMerchantOwner = requireRoles('MERCHANT_OWNER');

