import { PrismaService } from '../prisma.service';
export declare class PlatformService {
    private prisma;
    constructor(prisma: PrismaService);
    getNearbyStores(lat: number, lng: number, radiusKm?: number): Promise<{
        id: string;
        name: string;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        imageUrl: string | null;
        rating: number;
        operatingHours: string | null;
        distanceKm: number;
        availableSkus: number;
        description: string | null;
        topProducts: {
            id: string;
            name: string;
            imageUrl: string | null;
            sellingPrice: number;
        }[];
    }[]>;
    searchCatalog(query: string, lat: number, lng: number, radiusKm?: number): Promise<{
        query: string;
        lat: number;
        lng: number;
        radiusKm: number;
        totalResults: number;
        products: any[];
    }>;
    searchByBarcode(barcode: string, lat: number, lng: number, radiusKm?: number): Promise<{
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
    buildOndcCatalog(storeId: string): Promise<{
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
}
