const sharp = require('sharp');
const { minioClient, bucketName } = require('./storage.client');

/**
 * Security Scanner
 */
const scanImagePayload = (buffer) => {
    const maliciousSignatures = [
        '<?php', 'exec(', 'passthru(', 'shell_exec(', 'system(',
        'eval(', 'base64_decode(', '<script', 'javascript:',
        'onload=', 'onerror='
    ];

    const content = buffer.toString('utf8').toLowerCase();
    for (const sig of maliciousSignatures) {
        if (content.includes(sig.toLowerCase())) {
            return { safe: false, reason: `Malicious signature detected: ${sig}` };
        }
    }
    return { safe: true };
};

/**
 * Process image and upload to MinIO - Generates 4 sizes
 */
const uploadImage = async (fileBuffer, originalName) => {
    // 1. Security Scan
    const scanResult = scanImagePayload(fileBuffer);
    if (!scanResult.safe) {
        throw new Error(scanResult.reason);
    }

    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const baseFileName = `${timestamp}-${random}`;

    const sizes = [
        { name: 'small', width: 200, height: 200, fit: 'cover' },    // Gallery Thumbs
        { name: 'medium', width: 400, height: 400, fit: 'cover' },   // Product Cards
        { name: 'large', width: 800, height: 800, fit: 'cover' },    // Product Detail Main
        { name: 'original', width: 1600, height: 1600, fit: 'inside' } // Original/Zoom
    ];

    const uploadPromises = sizes.map(async (size) => {
        const processedBuffer = await sharp(fileBuffer)
            .resize(size.width, size.height, {
                fit: size.fit,
                withoutEnlargement: true,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 80, effort: 6 })
            .toBuffer();

        const fileName = `${baseFileName}_${size.name}.webp`;

        await minioClient.putObject(
            bucketName,
            fileName,
            processedBuffer,
            processedBuffer.length,
            { 'Content-Type': 'image/webp' }
        );

        return fileName;
    });

    const fileNames = await Promise.all(uploadPromises);
    const originalFileName = fileNames.find(n => n.includes('_original'));

    const baseUrl = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
    return `${baseUrl}/${bucketName}/${originalFileName}`;
};

const deleteImage = async (url) => {
    try {
        const urlParts = url.split('/');
        const originalFileName = urlParts[urlParts.length - 1];
        if (!originalFileName) throw new Error('Geçersiz dosya URL\'i.');

        const baseFileName = originalFileName.split('_')[0];
        const sizes = ['small', 'medium', 'large', 'original'];

        const deletePromises = sizes.map(size =>
            minioClient.removeObject(bucketName, `${baseFileName}_${size}.webp`)
        );

        await Promise.all(deletePromises);
        return true;
    } catch (err) {
        console.error('MinIO Delete Error:', err);
        throw err;
    }
};

module.exports = {
    uploadImage,
    deleteImage,
    scanImagePayload
};
