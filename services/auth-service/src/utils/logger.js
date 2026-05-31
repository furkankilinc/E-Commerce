const winston = require('winston');
const { SeqTransport } = require('@datalust/winston-seq');

const serviceName = 'auth-service';
const seqUrl = process.env.SEQ_URL || 'http://seq:80';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new SeqTransport({
      serverUrl: seqUrl,
      onError: (e) => { /* Silently ignore and rely on console fallback */ }
    })
  ]
});

// Capture original consoles
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

console.log = (...args) => {
  originalLog(...args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logger.info({ message: msg, service: serviceName });
};

console.info = (...args) => {
  originalInfo(...args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logger.info({ message: msg, service: serviceName });
};

console.warn = (...args) => {
  originalWarn(...args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logger.warn({ message: msg, service: serviceName });
};

console.error = (...args) => {
  originalError(...args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logger.error({ message: msg, service: serviceName });
};

module.exports = logger;
