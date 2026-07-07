export declare class StorageService {
    private readonly logger;
    private s3;
    private readonly isConfigured;
    constructor();
    uploadFile(fileBuffer: Buffer, mimetype: string, folder?: string): Promise<string>;
    uploadProductImage(fileBuffer: Buffer, mimetype: string): Promise<string>;
    uploadReceipt(fileBuffer: Buffer, mimetype: string): Promise<string>;
}
