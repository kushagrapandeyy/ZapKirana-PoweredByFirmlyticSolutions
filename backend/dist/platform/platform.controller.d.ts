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
            category: any;
            mrp: any;
            sellingPrice: any;
            imageUrl: string | null;
            store: {
                id: any;
                name: any;
                imageUrl: any;
                rating: any;
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
                short_desc: any;
                images: string[];
                code: any;
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
            category_id: any;
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
                short_desc: any;
                images: string[];
                code: any;
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
            category_id: any;
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
            gstin: string | null;
            pan: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            legalName: string | null;
            plan: string;
        };
        store: {
            id: string;
            organizationId: string | null;
            name: string;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            gstin: string | null;
            pan: string | null;
            fssaiLicenseNo: string | null;
            isActive: boolean;
            imageUrl: string | null;
            logoUrl: string | null;
            bannerUrl: string | null;
            operatingHours: import("@prisma/client/runtime/library").JsonValue | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
            stateCode: string | null;
            stateName: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            organizationId: string | null;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            password: string | null;
            pin: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            storeId: string | null;
            avatarUrl: string | null;
            isVerified: boolean;
            pushToken: string | null;
            zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
}
