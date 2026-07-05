import { PlatformService } from './platform.service';
export declare class PlatformController {
    private readonly platformService;
    constructor(platformService: PlatformService);
    getNearbyStores(lat: string, lng: string, radiusKm?: string): Promise<any[]>;
    searchCatalog(q: string, lat: string, lng: string, radiusKm?: string): Promise<{
        query: string;
        lat: number;
        lng: number;
        radiusKm: number;
        totalResults: number;
        products: any[];
    }>;
    searchByBarcode(code: string, lat: string, lng: string, radiusKm?: string): Promise<{
        barcode: string;
        totalStores: number;
        stores: {
            productId: string;
            name: string;
            category: string | null;
            mrp: number;
            sellingPrice: number;
            imageUrl: string | null;
            store: {
                id: string;
                name: string;
                imageUrl: string | null;
                rating: number;
            };
            distanceKm: number;
            availableQty: number;
            inStock: boolean;
        }[];
    }>;
    syncOndcCatalog(storeId: string): Promise<{
        bpp_id: string;
        bpp_uri: string;
        descriptor: {
            name: string;
            images: string[];
        };
        fulfillments: {
            id: string;
            type: string;
            start: {
                location: {
                    gps: string;
                    address: {
                        locality: string;
                    };
                };
            };
        }[];
        items: {
            id: string;
            descriptor: {
                name: string;
                short_desc: string;
                images: string[];
                code: string;
            };
            price: {
                currency: string;
                value: string;
                maximum_value: string;
            };
            quantity: {
                available: {
                    count: string;
                };
                maximum: {
                    count: string;
                };
            };
            category_id: string;
            tags: {
                code: string;
                list: {
                    code: string;
                    value: string;
                }[];
            }[];
        }[];
        itemCount: number;
        generatedAt: string;
    } | {
        error: string;
    }>;
    previewOndcCatalog(storeId: string): Promise<{
        bpp_id: string;
        bpp_uri: string;
        descriptor: {
            name: string;
            images: string[];
        };
        fulfillments: {
            id: string;
            type: string;
            start: {
                location: {
                    gps: string;
                    address: {
                        locality: string;
                    };
                };
            };
        }[];
        items: {
            id: string;
            descriptor: {
                name: string;
                short_desc: string;
                images: string[];
                code: string;
            };
            price: {
                currency: string;
                value: string;
                maximum_value: string;
            };
            quantity: {
                available: {
                    count: string;
                };
                maximum: {
                    count: string;
                };
            };
            category_id: string;
            tags: {
                code: string;
                list: {
                    code: string;
                    value: string;
                }[];
            }[];
        }[];
        itemCount: number;
        generatedAt: string;
    } | {
        error: string;
    }>;
    onboardVendor(body: any): Promise<{
        message: string;
        organization: {
            id: string;
            name: string;
            legalName: string | null;
            gstin: string | null;
            pan: string | null;
            plan: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
        store: {
            id: string;
            name: string;
            gstin: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            isActive: boolean;
            imageUrl: string | null;
            operatingHours: string | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        };
        user: {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            email: string;
            phone: string | null;
            password: string | null;
            pin: string | null;
            role: import(".prisma/client").$Enums.Role;
            storeId: string | null;
            avatarUrl: string | null;
            isVerified: boolean;
            pushToken: string | null;
        };
    }>;
}
