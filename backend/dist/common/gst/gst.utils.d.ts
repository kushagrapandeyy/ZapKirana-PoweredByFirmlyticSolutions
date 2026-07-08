export declare const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product";
export declare const GST_RATE_MAP: Record<string, number>;
export declare function inferGstClass(categories: string): string;
export interface OffEnrichmentResult {
    source: 'local_cache' | 'open_food_facts' | 'unknown';
    barcode: string;
    storeProductId?: string;
    name: string;
    brand?: string;
    category?: string;
    imageUrl?: string | null;
    mrp: number;
    sellingPrice: number;
    gstClass?: string;
    gstRate?: number;
    cgstRate?: number;
    sgstRate?: number;
}
