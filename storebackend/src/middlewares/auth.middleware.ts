import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenAudience, AccessTokenPayload } from '../utils/token.util';

// Express Request'e payload alanı ekle
declare global {
    namespace Express {
        interface Request {
            tokenPayload?: AccessTokenPayload;
        }
    }
}

/**
 * Belirtilen audience için token doğrulayan middleware factory.
 * 
 * Kullanım:
 *   router.get('/profile', authenticate('user'), handler)
 *   router.get('/dashboard', authenticate('admin'), handler)
 */
export const authenticate =
    (audience: TokenAudience) =>
        (req: Request, res: Response, next: NextFunction) => {
            const authHeader = req.headers['authorization'];

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı.' });
            }

            const token = authHeader.split(' ')[1];

            try {
                const payload = verifyAccessToken(token, audience);
                req.tokenPayload = payload;
                next();
            } catch (err) {
                return res.status(401).json({ message: 'Token geçersiz veya süresi dolmuş.' });
            }
        };

/**
 * Admin rolü kontrolü. authenticate('admin') sonrası kullanılır.
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.tokenPayload?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Bu işlem için SUPER_ADMIN yetkisi gereklidir.' });
    }
    next();
};
