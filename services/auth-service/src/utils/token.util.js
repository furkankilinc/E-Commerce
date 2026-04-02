const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'auth_secret_key', { expiresIn: '15m' });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'auth_refresh_secret_key', { expiresIn: '7d' });
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'auth_refresh_secret_key');
};

const refreshTokenExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiryDate
};
