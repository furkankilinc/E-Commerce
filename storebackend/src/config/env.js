require('dotenv').config();

const required = (key) => {
    const value = process.env[key];
    if (!value) {
        console.error(`❌ FATAL: Environment variable "${key}" is not set.`);
        process.exit(1);
    }
    return value;
};

const env = {
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: required('DATABASE_URL'),
    REDIS_URL: process.env.REDIS_URL || '',

    // JWT Secrets
    JWT_USER_SECRET: required('JWT_USER_SECRET'),
    JWT_MERCHANT_SECRET: required('JWT_MERCHANT_SECRET'),
    JWT_ADMIN_SECRET: required('JWT_ADMIN_SECRET'),
};

module.exports = { env };
