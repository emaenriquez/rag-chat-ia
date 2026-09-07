import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

class R2Service {
    private client: S3Client | null = null;

    private getClient(): S3Client {
        if (!this.client) {
            if (!env.r2AccessKeyId || !env.r2SecretAccessKey || !env.r2Endpoint) {
                throw new Error('Faltan credenciales de Cloudflare R2 (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT / ENPOINT)');
            }
            this.client = new S3Client({
                region: 'auto',
                endpoint: env.r2Endpoint,
                credentials: {
                    accessKeyId: env.r2AccessKeyId,
                    secretAccessKey: env.r2SecretAccessKey,
                },
            });
        }
        return this.client;
    }

    async uploadFile(key: string, buffer: Buffer, mimeType?: string): Promise<string> {
        const client = this.getClient();
        await client.send(
            new PutObjectCommand({
                Bucket: env.r2BucketName,
                Key: key,
                Body: buffer,
                ContentType: mimeType || 'application/octet-stream',
            })
        );
        return key;
    }

    async getFileBuffer(key: string): Promise<Buffer> {
        const client = this.getClient();
        const response = await client.send(
            new GetObjectCommand({
                Bucket: env.r2BucketName,
                Key: key,
            })
        );

        if (!response.Body) {
            throw new Error(`Archivo no encontrado en R2: ${key}`);
        }

        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
    }

    async deleteFile(key: string): Promise<void> {
        const client = this.getClient();
        await client.send(
            new DeleteObjectCommand({
                Bucket: env.r2BucketName,
                Key: key,
            })
        );
    }
}

export const r2Service = new R2Service();
