const logger = require('../utils/logger');
const { verifyAccessToken } = require('../utils/token.util');

/**
 * Standard Auth Error Responses for consistency
 */
const sendAuthError = (res, status, code, message, detail) => {
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
 * @param {string} allowedAudience - The target group (user, merchant, admin)
 */
const authenticate = (allowedAudience) => {
    return (req, res, next) => {
        let token;

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

            next();
        } catch (err) {
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
 * 
 * @param {...string} allowedRoles - List of roles that can access the path
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
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

const requireSuperAdmin = requireRoles('SUPER_ADMIN');
const requireMerchantOwner = requireRoles('MERCHANT_OWNER');

module.exports = {
    authenticate,
    requireRoles,
    requireSuperAdmin,
    requireMerchantOwner
};
