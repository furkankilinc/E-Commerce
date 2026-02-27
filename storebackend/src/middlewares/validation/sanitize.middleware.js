const logger = require('../../utils/logger');

/**
 * Recursive Sanitizer
 * Gelen veri ne kadar derin olursa olsun (iç içe objeler/arrayler), 
 * tüm string değerleri tarar ve temizler.
 */
const cleanValue = (value) => {
    if (typeof value === 'string') {
        return value
            .replace(/[<>]/g, '') // < ve > karakterlerini sil (HTML etiketlerini bozar)
            .replace(/javascript:/gi, '') // "javascript:" protokolünü sil
            .replace(/on\w+=/gi, '') // onmouseover, onclick gibi eventleri sil
            .trim();
    }

    if (Array.isArray(value)) {
        return value.map(item => cleanValue(item));
    }

    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        const cleanObj = {};
        for (const key in value) {
            cleanObj[key] = cleanValue(value[key]);
        }
        return cleanObj;
    }

    return value;
};

/**
 * Premium Sanitization Middleware
 * req.body, req.query ve req.params nesnelerini otomatik temizler.
 */
const sanitize = (req, res, next) => {
    try {
        if (req.body) req.body = cleanValue(req.body);
        if (req.query) req.query = cleanValue(req.query);
        if (req.params) req.params = cleanValue(req.params);

        next();
    } catch (err) {
        logger.error('[SECURITY/SANITIZE] Sanitization failed:', err);
        // Hata olsa bile güvenli tarafta kalmak için boşaltalım veya devam edelim
        next();
    }
};

module.exports = sanitize;
