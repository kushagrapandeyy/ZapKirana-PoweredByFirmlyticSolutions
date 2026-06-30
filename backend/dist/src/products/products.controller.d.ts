import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    createProduct(body: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    findAll(storeId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }[]> | {
        error: string;
    };
    findByBarcode(barcode: string, storeId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }> | {
        error: string;
    };
    findOne(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    updatePrice(id: string, body: {
        mrp: number;
        sellingPrice: number;
    }): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
}
