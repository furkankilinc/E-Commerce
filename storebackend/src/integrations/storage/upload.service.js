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
 * Process image and upload to MinIO
 */
const uploadImage = async (fileBuffer, originalName) => {
    // 1. Security Scan
    const scanResult = scanImagePayload(fileBuffer);
    if (!scanResult.safe) {
        throw new Error(scanResult.reason);
    }

    // 2. Convert to WebP
    const processedBuffer = await sharp(fileBuffer)
        .webp({
            quality: 90,     // Daha yüksek kalite (%80'den %90'a)
            smartSubsample: true, // Renk geçişlerini daha keskin yapar
            effort: 6        // En iyi sıkıştırma algoritmasını kullanır (görüntü bozulmaz)
        })
        .toBuffer();

    // 3. MinIO Upload
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;

    await minioClient.putObject(
        bucketName,
        fileName,
        processedBuffer,
        processedBuffer.length,
        { 'Content-Type': 'image/webp' }
    );

    const baseUrl = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
    return `${baseUrl}/${bucketName}/${fileName}`;
};

const deleteImage = async (url) => {
    try {
        // Extract filename from URL (e.g., http://localhost:9090/products/123-456.webp)
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        if (!fileName) throw new Error('Geçersiz dosya URL\'i.');

        await minioClient.removeObject(bucketName, fileName);
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
