import { StorageService } from './storage.service';
export declare class StorageController {
    private readonly storageService;
    constructor(storageService: StorageService);
    uploadProductImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadReceipt(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
