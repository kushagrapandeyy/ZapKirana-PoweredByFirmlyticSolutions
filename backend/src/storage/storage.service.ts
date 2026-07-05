import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.R2_ENDPOINT && !!process.env.R2_ACCESS_KEY && !!process.env.R2_SECRET_KEY;
    
    if (this.isConfigured) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT, // e.g. https://<id>.r2.cloudflarestorage.com
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY!,
          secretAccessKey: process.env.R2_SECRET_KEY!,
        },
      });
      this.logger.log('StorageService initialized with Cloudflare R2.');
    } else {
      this.logger.warn('R2 credentials not found in env. StorageService will use mock local URLs.');
    }
  }

  /**
   * Uploads a file to Cloudflare R2 or returns a mock URL if not configured.
   */
  async uploadFile(fileBuffer: Buffer, mimetype: string, folder: string = 'uploads'): Promise<string> {
    const extension = mimetype.split('/')[1] || 'bin';
    const filename = `${folder}/${uuidv4()}.${extension}`;

    if (!this.isConfigured) {
      // Mock mode for local dev without R2 accounts
      this.logger.debug(`Mock upload: ${filename}`);
      return `https://mock.assets.zapkirana.in/${filename}`;
    }

    try {
      const bucket = process.env.R2_BUCKET || 'zapkirana-assets';
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: fileBuffer,
          ContentType: mimetype,
          CacheControl: 'public, max-age=31536000', // Cache for 1 year
        })
      );
      
      const cdnBase = process.env.CDN_BASE_URL || `https://${bucket}.r2.cloudflarestorage.com`;
      return `${cdnBase}/${filename}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to R2: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadProductImage(fileBuffer: Buffer, mimetype: string): Promise<string> {
    return this.uploadFile(fileBuffer, mimetype, 'products');
  }

  async uploadReceipt(fileBuffer: Buffer, mimetype: string): Promise<string> {
    return this.uploadFile(fileBuffer, mimetype, 'receipts');
  }
}
