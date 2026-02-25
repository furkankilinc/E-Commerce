const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

// ── Konsol formatı: renkli, okunabilir ────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

const baseFormat = combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
);

// ── Transport listesi ─────────────────────────────────────────────────────────
const loggerTransports = [
    // Renkli konsol çıktısı
    new transports.Console({
        format: combine(baseFormat, colorize({ all: true }), consoleFormat),
    }),
    // Tüm loglar dosyaya (JSON)
    new transports.File({
        filename: path.join(__dirname, '../../../logs/combined.log'),
        format: combine(baseFormat, json()),
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
    }),
    // Sadece hatalar ayrı dosyaya
    new transports.File({
        filename: path.join(__dirname, '../../../logs/errors.log'),
        level: 'error',
        format: combine(baseFormat, json()),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
    }),
];

// ── Seq Transport (varsa ekle, yoksa sessizce atla) ───────────────────────────
const SEQ_URL = process.env.SEQ_URL;
if (SEQ_URL) {
    try {
        const { SeqTransport } = require('@datalust/winston-seq');
        loggerTransports.push(
            new SeqTransport({
                serverUrl: SEQ_URL,
                onError: (e) => console.error('[Seq Transport Error]', e),
                handleExceptions: true,
                handleRejections: true,
            })
        );
        console.log(`🔍 Seq log sunucusuna bağlanıldı → ${SEQ_URL}`);
    } catch (err) {
        console.warn('⚠️  winston-seq yüklenemedi, Seq devre dışı:', err.message);
    }
}

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(baseFormat, json()),
    defaultMeta: { service: 'fuira-backend', env: process.env.NODE_ENV || 'development' },
    transports: loggerTransports,
});

// ── HTTP İstek Middleware ─────────────────────────────────────────────────────
logger.httpMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
                : 'info';

        logger[level](`${req.method} ${req.originalUrl}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent']?.substring(0, 80),
            method: req.method,
            path: req.originalUrl,
        });
    });
    next();
};

module.exports = logger;
