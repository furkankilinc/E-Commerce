const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

// ── Renk haritası (Konsol için) ────────────────────────────────────────────────
const STATUS_COLORS = {
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    RED: '\x1b[31m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    RESET: '\x1b[0m'
};

// ── Konsol formatı: renkli, görsel hiyerarşi ──────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const { service, env, ...rest } = meta;

    // Status koduna göre renk seçimi
    let colorSuffix = STATUS_COLORS.RESET;
    let colorPrefix = STATUS_COLORS.RESET;

    if (rest.status) {
        if (rest.status >= 500) colorPrefix = STATUS_COLORS.RED;
        else if (rest.status >= 400) colorPrefix = STATUS_COLORS.YELLOW;
        else if (rest.status >= 200) colorPrefix = STATUS_COLORS.GREEN;
    }

    // Emoji seçimi
    let emoji = 'ℹ️ ';
    if (level.includes('error')) emoji = '🔥 ';
    else if (level.includes('warn')) emoji = '⚠️ ';
    else if (level.includes('slow')) emoji = '🐌 ';
    else if (message.includes('[HTTP]')) emoji = '🌐 ';

    // Meta veri stringi (pretty print)
    const metaStr = Object.keys(rest).length ?
        `\n${STATUS_COLORS.CYAN}Metadata:${STATUS_COLORS.RESET} ${JSON.stringify(rest, null, 2)}` : '';

    const coloredMessage = message.includes('[HTTP]') ?
        message.replace(/(\s[2345]\d{2}\s)/, ` ${colorPrefix}$1${STATUS_COLORS.RESET} `) : message;

    return `${timestamp} ${emoji}${level.toUpperCase().padStart(5)}: ${coloredMessage}${metaStr}\n`;
});

const baseFormat = combine(
    errors({ stack: true }),
    timestamp({ format: 'HH:mm:ss' }) // Daha kısa timestamp konsol için
);

// ── Transport listesi ─────────────────────────────────────────────────────────
const loggerTransports = [
    // Renkli konsol çıktısı
    new transports.Console({
        format: combine(baseFormat, colorize({ all: true, colors: { info: 'blue', error: 'red', warn: 'yellow' } }), consoleFormat),
    }),
    // Tüm loglar dosyaya (JSON)
    new transports.File({
        filename: path.join(__dirname, '../../../logs/combined.log'),
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 7,
    }),
    // Sadece hatalar ayrı dosyaya
    new transports.File({
        filename: path.join(__dirname, '../../../logs/errors.log'),
        level: 'error',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 14,
    }),
];

// ── Seq Transport ─────────────────────────────────────────────────────────────
const SEQ_URL = process.env.SEQ_URL;
if (SEQ_URL) {
    try {
        const { SeqTransport } = require('@datalust/winston-seq');
        loggerTransports.push(
            new SeqTransport({
                serverUrl: SEQ_URL,
                apiKey: process.env.SEQ_API_KEY,
                onError: (e) => console.error('[Seq Transport Error]', e),
                handleExceptions: true,
                handleRejections: true,
            })
        );
        console.log(`🔍 Seq log sunucusuna bağlanıldı → ${SEQ_URL}`);
    } catch (err) {
        // Sessiz geçebiliriz
    }
}

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'fuira-backend', env: process.env.NODE_ENV || 'development' },
    transports: loggerTransports,
    exitOnError: false, // Hata gelince çökmesin
});

module.exports = logger;
