const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRETS = {
    user: process.env.JWT_USER_SECRET || 'user_secret_fallback',
    merchant: process.env.JWT_MERCHANT_SECRET || 'merchant_secret_fallback',
    admin: process.env.JWT_ADMIN_SECRET || 'admin_secret_fallback',
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
