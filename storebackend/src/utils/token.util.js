const jwt = require('jsonwebtoken');
require('dotenv').config();

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

const verifyAccessToken = (token, audience) => {
    return jwt.verify(token, SECRETS[audience]);
};

const verifyRefreshToken = (token, audience) => {
    return jwt.verify(token, SECRETS[audience]);
};

const refreshTokenExpiryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
};

// Also keep old names for compatibility if any other JS file uses them
const verifyToken = verifyAccessToken;
const refreshTokenExpiry = refreshTokenExpiryDate;

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    refreshTokenExpiryDate,
    verifyToken,
    refreshTokenExpiry
};

