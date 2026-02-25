const jwt = require('jsonwebtoken');
require('dotenv').config();

// ── Startup Guard ─────────────────────────────────────────────────────────────
// If any JWT secret is missing the application MUST NOT start.
// This prevents accidental deployment with predictable fallback keys.
const REQUIRED_SECRETS = ['JWT_USER_SECRET', 'JWT_MERCHANT_SECRET', 'JWT_ADMIN_SECRET'];
for (const key of REQUIRED_SECRETS) {
    if (!process.env[key]) {
        console.error(`❌ FATAL: Environment variable "${key}" is not set. Refusing to start.`);
        process.exit(1);
    }
}

const SECRETS = {
    user: process.env.JWT_USER_SECRET,
    merchant: process.env.JWT_MERCHANT_SECRET,
    admin: process.env.JWT_ADMIN_SECRET,
};

const generateAccessToken = (payload) => {
    return jwt.sign(payload, SECRETS[payload.audience], { expiresIn: '15m' });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, SECRETS[payload.audience], { expiresIn: '7d' });
};

const verifyToken = (token, audience) => {
    return jwt.verify(token, SECRETS[audience]);
};

const refreshTokenExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken, refreshTokenExpiry };

