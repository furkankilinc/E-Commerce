const Minio = require('minio');
require('dotenv').config();

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadminpassword'
});

const bucketName = process.env.MINIO_BUCKET || 'products';

// Auto-create bucket if not exists
(async () => {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName);
            // Set public read policy for the products bucket
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetBucketLocation", "s3:ListBucket"],
                        Resource: [`arn:aws:s3:::${bucketName}`]
                    },
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetObject"],
                        Resource: [`arn:aws:s3:::${bucketName}/*`]
                    }
                ]
            };
            await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
            console.log(`✅ MinIO Bucket '${bucketName}' created and policy set.`);
        }
    } catch (err) {
        console.error('❌ MinIO Init Error:', err);
    }
})();

module.exports = {
    minioClient,
    bucketName
};
