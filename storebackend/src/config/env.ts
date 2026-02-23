import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env variable: ${key}`);
    return value;
};

export const env = {
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: required('DATABASE_URL'),
    REDIS_URL: process.env.REDIS_URL || '',

    // Her audience için farklı JWT secret
    JWT_USER_SECRET: required('JWT_USER_SECRET'),
    JWT_MERCHANT_SECRET: required('JWT_MERCHANT_SECRET'),
    JWT_ADMIN_SECRET: required('JWT_ADMIN_SECRET'),
};
