import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    createProduct(body: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        description: string | null;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        imageUrl: string | null;
    }>;
    findAll(storeId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        description: string | null;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        imageUrl: string | null;
    }[]> | {
        error: string;
    };
    findByBarcode(barcode: string, storeId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        description: string | null;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        imageUrl: string | null;
    }> | {
        error: string;
    };
    findOne(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        description: string | null;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        imageUrl: string | null;
    }>;
    updatePrice(id: string, body: {
        mrp: number;
        sellingPrice: number;
    }): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        description: string | null;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        imageUrl: string | null;
    }>;
}
