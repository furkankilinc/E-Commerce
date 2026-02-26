import { Request, Response, NextFunction } from 'express';
const logger = require('../../utils/logger');

/**
 * Hassas verileri loglardan gizlemek için yardımcı fonksiyon
 */
const maskSensitiveData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    const masked = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'creditCard', 'cvv', 'secret'];

    Object.keys(masked).forEach(key => {
        if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
            masked[key] = '********';
        } else if (typeof masked[key] === 'object' && masked[key] !== null) {
            masked[key] = maskSensitiveData(masked[key]);
        }
    });
    return masked;
};

/**
 * User-Agent'tan Cihaz ve OS Bilgisi Çıkaran Yardımcı
 */
const getDeviceInfo = (ua: string | undefined): string => {
    if (!ua) return 'Bilinmeyen Cihaz';

    let os = 'Bilinmeyen OS';
    let device = 'Bilgisayar (Masaüstü)';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Android')) { os = 'Android'; device = 'Telefon (Mobil)'; }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = ua.includes('iPhone') ? 'iPhone' : 'iPad'; }
    else if (ua.includes('Linux')) os = 'Linux';

    let browser = 'Bilinmeyen Tarayıcı';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return `${device} - ${os} (${browser})`;
};

/**
 * Gelişmiş HTTP İstek Loglayıcı - Detaylı Kullanıcı & Cihaz Takibi (TypeScript)
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startHrTime = process.hrtime();
    const requestId = (req.headers['x-request-id'] as string) || Math.random().toString(36).substring(2, 10).toUpperCase();

    res.setHeader('X-Request-Id', requestId);
    (req as any).id = requestId;

    res.on('finish', () => {
        const elapsedHrTime = process.hrtime(startHrTime);
        const durationMs = parseFloat((elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2));

        const statusCode = res.statusCode;
        let level = 'info';
        if (statusCode >= 500) level = 'error';
        else if (statusCode >= 400) level = 'warn';

        const userPayload = (req as any).tokenPayload || (req as any).adminPayload || (req as any).merchantPayload || null;

        const timestamp = new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
            hour12: false
        });

        const userAgentRaw = req.headers['user-agent'];
        const deviceDetail = getDeviceInfo(userAgentRaw);

        const logMetadata = {
            RequestId: requestId,
            Timestamp: timestamp,
            Method: req.method,
            Path: req.originalUrl,
            Status: statusCode,
            Elapsed: durationMs,
            ClientIP: req.ip || req.headers['x-forwarded-for'],

            Kullanıcı: userPayload ? (userPayload.name || userPayload.email) : 'Ziyaretçi (Anonymous)',
            KullanıcıEmail: userPayload ? userPayload.email : null,
            KullanıcıRol: userPayload ? userPayload.role : 'GUEST',

            Cihaz: deviceDetail,
            TarayıcıHamVeri: userAgentRaw,

            Query: Object.keys(req.query).length > 0 ? req.query : undefined,
            Body: (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body || {}).length > 0)
                ? maskSensitiveData(req.body) : undefined,
            SourceContext: 'HttpRequest'
        };

        const msg = `[HTTP] {Method} {Path} responded {Status} in {Elapsed} ms | Cihaz: {Cihaz} | Kullanıcı: {Kullanıcı}`;

        if (durationMs > 1000) {
            logger.warn(`🐌 YAVAŞ İSTEK: ${msg}`, logMetadata);
        } else {
            logger[level](msg, logMetadata);
        }
    });

    next();
};

export default requestLogger;
