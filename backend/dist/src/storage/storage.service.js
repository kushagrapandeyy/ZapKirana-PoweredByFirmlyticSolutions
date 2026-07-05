"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
let StorageService = StorageService_1 = class StorageService {
    logger = new common_1.Logger(StorageService_1.name);
    s3;
    isConfigured;
    constructor() {
        this.isConfigured = !!process.env.R2_ENDPOINT && !!process.env.R2_ACCESS_KEY && !!process.env.R2_SECRET_KEY;
        if (this.isConfigured) {
            this.s3 = new client_s3_1.S3Client({
                region: 'auto',
                endpoint: process.env.R2_ENDPOINT,
                credentials: {
                    accessKeyId: process.env.R2_ACCESS_KEY,
                    secretAccessKey: process.env.R2_SECRET_KEY,
                },
            });
            this.logger.log('StorageService initialized with Cloudflare R2.');
        }
        else {
            this.logger.warn('R2 credentials not found in env. StorageService will use mock local URLs.');
        }
    }
    async uploadFile(fileBuffer, mimetype, folder = 'uploads') {
        const extension = mimetype.split('/')[1] || 'bin';
        const filename = `${folder}/${(0, uuid_1.v4)()}.${extension}`;
        if (!this.isConfigured) {
            this.logger.debug(`Mock upload: ${filename}`);
            return `https://mock.assets.zapkirana.in/${filename}`;
        }
        try {
            const bucket = process.env.R2_BUCKET || 'zapkirana-assets';
            await this.s3.send(new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: filename,
                Body: fileBuffer,
                ContentType: mimetype,
                CacheControl: 'public, max-age=31536000',
            }));
            const cdnBase = process.env.CDN_BASE_URL || `https://${bucket}.r2.cloudflarestorage.com`;
            return `${cdnBase}/${filename}`;
        }
        catch (error) {
            this.logger.error(`Failed to upload file to R2: ${error.message}`, error.stack);
            throw error;
        }
    }
    async uploadProductImage(fileBuffer, mimetype) {
        return this.uploadFile(fileBuffer, mimetype, 'products');
    }
    async uploadReceipt(fileBuffer, mimetype) {
        return this.uploadFile(fileBuffer, mimetype, 'receipts');
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map