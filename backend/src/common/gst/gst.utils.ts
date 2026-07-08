/**
 * Shared GST utilities used by both ProductsService and CatalogService.
 * Single source of truth — do not duplicate these functions.
 */

export const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';

export const GST_RATE_MAP: Record<string, number> = {
  EXEMPT: 0,
  GST_5: 5,
  GST_12: 12,
  GST_18: 18,
  GST_28: 28,
};

/**
 * Infer a GST class bucket from Open Food Facts category string.
 * Returns one of: EXEMPT | GST_5 | GST_12 | GST_18 | GST_28
 */
export function inferGstClass(categories: string): string {
  const c = categories.toLowerCase();
  if (c.includes('beverage') || c.includes('aerated') || c.includes('cola') || c.includes('soda')) return 'GST_28';
  if (c.includes('biscuit') || c.includes('pasta') || c.includes('noodle') || c.includes('ice cream') || c.includes('chocolate')) return 'GST_18';
  if (c.includes('juice') || c.includes('butter') || c.includes('cheese') || c.includes('ghee') || c.includes('namkeen')) return 'GST_12';
  if (c.includes('oil') || c.includes('sugar') || c.includes('spice') || c.includes('tea') || c.includes('coffee') || c.includes('packed')) return 'GST_5';
  return 'EXEMPT';
}

/**
 * Typed result from the Open Food Facts enrichment.
 */
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
