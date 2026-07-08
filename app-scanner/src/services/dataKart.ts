/**
 * DataKart API Client
 *
 * DataKart is an Indian product master database providing:
 * - Product name, brand, and packaging details
 * - HSN/SAC codes
 * - FSSAI numbers
 * - GST rates
 * - MRP (where available)
 *
 * Resolution order for a barcode scan:
 *   1. Local SQLite cache (instant, offline-safe)
 *   2. Basko backend DB (fast, store-specific pricing)
 *   3. DataKart API (cloud, fills master for unknown barcodes)
 *   4. Open Food Facts (global fallback)
 *   5. Manual entry (last resort)
 */

import { DATAKART_API_URL, DATAKART_API_KEY, API_BASE_URL } from '../constants/api';
import { localCache } from './localCache';

export interface ProductMaster {
  barcode: string;
  name: string;
  brand?: string;
  packagingType?: string;   // e.g. "Tetra Pack", "PET Bottle", "Pouch"
  netWeight?: string;       // e.g. "500g", "1L"
  hsnSacCode?: string;
  gstRate?: number;         // total GST %
  cgstRate?: number;
  sgstRate?: number;
  mrp?: number;
  fssaiNumber?: string;
  imageUrl?: string | null;
  source: 'local_cache' | 'basko_db' | 'datakart' | 'openfoodfacts' | 'unknown';
}

/**
 * Resolve a barcode to a ProductMaster using the full resolution chain.
 * Results are cached locally after the first cloud hit.
 */
export async function resolveBarcode(
  barcode: string,
  storeId: string,
  authToken: string,
): Promise<ProductMaster> {
  // ── Tier 1: Local SQLite cache ──────────────────────────────────────────
  const cached = await localCache.getProduct(barcode);
  if (cached) {
    return { ...cached, source: 'local_cache' };
  }

  // ── Tier 2: Basko backend DB ────────────────────────────────────────────
  try {
    const res = await fetch(
      `${API_BASE_URL}/catalog/barcode/${encodeURIComponent(barcode)}?storeId=${storeId}`,
      { headers: { Authorization: `Bearer ${authToken}` }, signal: AbortSignal.timeout(3000) },
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.product) {
        const product: ProductMaster = {
          barcode,
          name: data.product.name,
          brand: data.product.brand,
          hsnSacCode: data.product.hsnSacCode,
          mrp: data.product.mrp,
          gstRate: data.product.gstRate,
          cgstRate: data.product.cgstRate,
          sgstRate: data.product.sgstRate,
          imageUrl: data.product.imageUrl,
          source: 'basko_db',
        };
        await localCache.saveProduct(product);
        return product;
      }
    }
  } catch {
    // Offline or timeout — continue to next tier
  }

  // ── Tier 3: DataKart API ────────────────────────────────────────────────
  if (DATAKART_API_KEY) {
    try {
      const res = await fetch(
        `${DATAKART_API_URL}/products/${encodeURIComponent(barcode)}`,
        {
          headers: { 'X-API-Key': DATAKART_API_KEY, Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        },
      );
      if (res.ok) {
        const dk = await res.json();
        const product: ProductMaster = {
          barcode,
          name: dk.product_name ?? dk.name ?? '',
          brand: dk.brand_name ?? dk.brand,
          packagingType: dk.packaging_type,
          netWeight: dk.net_weight,
          hsnSacCode: dk.hsn_code,
          gstRate: dk.gst_rate ? Number(dk.gst_rate) : undefined,
          cgstRate: dk.cgst_rate ? Number(dk.cgst_rate) : undefined,
          sgstRate: dk.sgst_rate ? Number(dk.sgst_rate) : undefined,
          mrp: dk.mrp ? Number(dk.mrp) : undefined,
          fssaiNumber: dk.fssai_number,
          imageUrl: dk.image_url ?? null,
          source: 'datakart',
        };
        await localCache.saveProduct(product);
        return product;
      }
    } catch {
      // DataKart unavailable — continue
    }
  }

  // ── Tier 4: Open Food Facts (global fallback) ───────────────────────────
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,categories,image_url`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const product: ProductMaster = {
          barcode,
          name: p.product_name ?? 'Unknown Product',
          brand: p.brands,
          imageUrl: p.image_url ?? null,
          source: 'openfoodfacts',
        };
        await localCache.saveProduct(product);
        return product;
      }
    }
  } catch {
    // Offline
  }

  // ── Tier 5: Unknown ─────────────────────────────────────────────────────
  return { barcode, name: '', source: 'unknown' };
}
