const logger = require('../../utils/logger');
const jwt = require('jsonwebtoken');

/**
 * Hassas verileri loglardan gizlemek için yardımcı fonksiyon
 */
const maskSensitiveData = (data) => {
    if (!data || typeof data !== 'object') return data;
    const masked = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'creditCard', 'cvv', 'secret', 'authorization', 'cookie'];

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
const getDeviceInfo = (ua) => {
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
 * Gelişmiş HTTP İstek Loglayıcı - Detaylı Kullanıcı & Cihaz Takibi
 */
const requestLogger = (req, res, next) => {
    const startHrTime = process.hrtime();
    const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 10).toUpperCase();

    res.setHeader('X-Request-Id', requestId);
    req.id = requestId;

    res.on('finish', () => {
        const elapsedHrTime = process.hrtime(startHrTime);
        const durationMs = parseFloat((elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2));

        const statusCode = res.statusCode;
        let level = 'info';
        if (statusCode >= 500) level = 'error';
        else if (statusCode >= 400) level = 'warn';

        // --- Kullanıcı Bilgisi Çıkarma (Geliştirilmiş) ---
        let userIdentity = 'Ziyaretçi (Anonymous)';
        let userEmail = null;
        let userRole = 'GUEST';
        let userId = null;

        // Öncelik Sırası:
        // 1. tokenPayload (Yeni Auth sistemi)
        // 2. adminPayload / merchantPayload
        // 3. userId (Eski sistem rotaları)
        // 4. Authorization Header (Decode denemesi)

        const payload = req.tokenPayload || req.adminPayload || req.merchantPayload || req.userPayload;

        if (payload) {
            userEmail = payload.email || payload.name;
            userRole = payload.role || payload.audience || 'USER';
            userId = payload.sub || payload.id;
            userIdentity = payload.name || payload.email || `${userRole}:${userId}`;
        }
        else if (req.userId || req.adminId || req.merchantId) {
            userId = req.userId || req.adminId || req.merchantId;
            userRole = req.adminId ? 'ADMIN' : (req.merchantId ? 'MERCHANT' : 'USER');
            userIdentity = `ID:${userId} (LegacyAuth)`;
        }

        // Eğer hala bulunamadıysa Header veya Cookie'yi zorla!
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const cookieToken = req.cookies ? req.cookies.token : null;

        if (userIdentity === 'Ziyaretçi (Anonymous)' && (authHeader || cookieToken)) {
            try {
                const token = cookieToken || (authHeader.includes(' ') ? authHeader.split(' ')[1] : authHeader);
                const decoded = jwt.decode(token);
                if (decoded) {
                    userId = decoded.sub || decoded.id;
                    userEmail = decoded.email;
                    userRole = decoded.role || decoded.audience || 'USER';
                    userIdentity = (decoded.email || decoded.name || userId) + (cookieToken ? ' (Cookie)' : ' (AuthHeader)');
                }
            } catch (e) {
                // Sessiz hata
            }
        }

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

            Kullanıcı: userIdentity,
            KullanıcıEmail: userEmail,
            KullanıcıRol: userRole,
            UserId: userId,

            Cihaz: deviceDetail,
            Headers: {
                Host: req.headers['host'],
                Referer: req.headers['referer'],
                HasAuth: !!authHeader,
                AuthType: authHeader ? authHeader.split(' ')[0] : 'None'
            },

            IsSlow: durationMs > 1000,
            Query: Object.keys(req.query).length > 0 ? req.query : undefined,
            Body: (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body || {}).length > 0)
                ? maskSensitiveData(req.body) : undefined,
            SourceContext: 'HttpRequest'
        };

        const msg = `[HTTP] {Method} {Path} responded {Status} in {Elapsed} ms | {Kullanıcı}`;

        if (durationMs > 1000) {
            logger.warn(`🐌 YAVAŞ: ${msg}`, logMetadata);
        } else {
            logger[level](msg, logMetadata);
        }
    });

    next();
};

module.exports = requestLogger;
