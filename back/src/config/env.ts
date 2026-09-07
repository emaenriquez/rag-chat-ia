import 'dotenv/config';

function required(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing env variable: ${key}`);
    return value;
}

export const env = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
    jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR || 'storage/documents',
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 20,
    geminiApiKey: required('GEMINI_API_KEY'),
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2Endpoint: process.env.R2_ENDPOINT || process.env.ENPOINT || process.env.ENDPOINT || '',
    r2BucketName: process.env.R2_BUCKET_NAME || process.env.BUCKET_NAME || 'rag-documents',
};