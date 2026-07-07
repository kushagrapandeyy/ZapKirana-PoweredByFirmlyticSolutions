import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

import { CacheService } from '../cache/cache.service';

// Haversine formula
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class PlatformService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Enhanced store discovery — returns stores with live available inventory count.
   */
  async getNearbyStores(lat: number, lng: number, radiusKm = 5) {
    const cacheKey = `platform:nearby_stores:${Math.round(lat * 100)}:${Math.round(lng * 100)}:${radiusKm}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const stores = await this.prisma.store.findMany({
      where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
      include: {
        inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } },
        products: { 
          where: { isActive: true }, 
          take: 4,
          select: { id: true, name: true, imageUrl: true, sellingPrice: true }
        }
      },
    });

    const result = stores
      .map((store) => {
        const distance = haversineKm(lat, lng, store.latitude!, store.longitude!);
        const availableSkus = store.inventory.filter(
          (i) => i.onHandQty - i.reservedQty - i.blockedQty > 0,
        ).length;
        return {
          id: store.id,
          name: store.name,
          location: store.location,
          latitude: store.latitude,
          longitude: store.longitude,
          imageUrl: store.imageUrl,
          rating: store.rating,
          operatingHours: store.operatingHours,
          distanceKm: Math.round(distance * 10) / 10,
          availableSkus,
          description: store.description,
          topProducts: store.products
        };
      })
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    await this.cache.set(cacheKey, result, 60); // cache for 60 seconds
    return result;
  }

  /**
   * THE MOAT: Cross-store product search by name/query.
   * Returns which nearby stores carry the product, with price and stock.
   *
   * GET /platform/catalog/search?q=atta&lat=12.9&lng=77.5&radiusKm=5
   */
  async searchCatalog(query: string, lat: number, lng: number, radiusKm = 5) {
    // 1. Find all matching products across all stores
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        store: {
          select: {
            id: true, name: true, latitude: true, longitude: true, rating: true, imageUrl: true,
          },
        },
        inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } },
      },
    });

    // 2. Filter by radius, compute available qty, sort by distance then price
    const results = products
      .filter((p) => p.store.latitude && p.store.longitude)
      .map((p) => {
        const distance = haversineKm(lat, lng, p.store.latitude!, p.store.longitude!);
        const inv = p.inventory[0];
        const available = inv ? Math.max(0, inv.onHandQty - inv.reservedQty - inv.blockedQty) : 0;
        return {
          productId: p.id,
          name: p.name,
          category: p.category,
          mrp: p.mrp,
          sellingPrice: p.sellingPrice,
          imageUrl: p.imageUrl,
          barcode: p.barcode,
          store: { id: p.store.id, name: p.store.name, imageUrl: p.store.imageUrl, rating: p.store.rating },
          distanceKm: Math.round(distance * 10) / 10,
          availableQty: available,
          inStock: available > 0,
        };
      })
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => {
        // In-stock first, then by distance, then by price
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        return a.sellingPrice - b.sellingPrice;
      });

    // 3. Group by product name for cleaner UX (same item from multiple stores)
    const grouped: Record<string, any> = {};
    for (const r of results) {
      const key = r.name.toLowerCase().trim();
      if (!grouped[key]) {
        grouped[key] = { name: r.name, category: r.category, imageUrl: r.imageUrl, stores: [] };
      }
      grouped[key].stores.push({
        productId: r.productId,
        storeId: r.store.id,
        storeName: r.store.name,
        storeImageUrl: r.store.imageUrl,
        storeRating: r.store.rating,
        sellingPrice: r.sellingPrice,
        mrp: r.mrp,
        distanceKm: r.distanceKm,
        availableQty: r.availableQty,
        inStock: r.inStock,
      });
    }

    return {
      query,
      lat,
      lng,
      radiusKm,
      totalResults: results.length,
      products: Object.values(grouped),
    };
  }

  /**
   * THE MOAT: "Which stores near me sell this exact barcode?"
   * GET /platform/catalog/barcode/:code?lat=&lng=&radiusKm=
   */
  async searchByBarcode(barcode: string, lat: number, lng: number, radiusKm = 5) {
    const products = await this.prisma.product.findMany({
      where: { barcode, isActive: true },
      include: {
        store: {
          select: { id: true, name: true, latitude: true, longitude: true, rating: true, imageUrl: true },
        },
        inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } },
      },
    });

    const results = products
      .filter((p) => p.store.latitude && p.store.longitude)
      .map((p) => {
        const distance = haversineKm(lat, lng, p.store.latitude!, p.store.longitude!);
        const inv = p.inventory[0];
        const available = inv ? Math.max(0, inv.onHandQty - inv.reservedQty - inv.blockedQty) : 0;
        return {
          productId: p.id,
          name: p.name,
          category: p.category,
          mrp: p.mrp,
          sellingPrice: p.sellingPrice,
          imageUrl: p.imageUrl,
          store: { id: p.store.id, name: p.store.name, imageUrl: p.store.imageUrl, rating: p.store.rating },
          distanceKm: Math.round(distance * 10) / 10,
          availableQty: available,
          inStock: available > 0,
        };
      })
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => {
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return a.sellingPrice - b.sellingPrice;
      });

    return { barcode, totalStores: results.length, stores: results };
  }

  /**
   * ONDC Catalog Sync — builds the ONDC-compatible catalog JSON for a store.
   * POST /platform/ondc/sync?storeId=x
   */
  async buildOndcCatalog(storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return { error: 'Store not found' };

    const products = await this.prisma.product.findMany({
      where: { storeId, isActive: true },
      include: { inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } } },
    });

    const ondcItems = products.map((p) => {
      const inv = p.inventory[0];
      const available = inv ? Math.max(0, inv.onHandQty - inv.reservedQty - inv.blockedQty) : 0;
      return {
        id: p.id,
        descriptor: {
          name: p.name,
          short_desc: p.description ?? '',
          images: p.imageUrl ? [p.imageUrl] : [],
          code: p.barcode ?? p.skuCode,
        },
        price: {
          currency: 'INR',
          value: String(p.sellingPrice),
          maximum_value: String(p.mrp),
        },
        quantity: {
          available: { count: String(available) },
          maximum: { count: String(available) },
        },
        category_id: p.category ?? 'grocery',
        tags: [
          { code: 'tax_rate', list: [{ code: 'tax_rate', value: String(p.gstRate) }] },
        ],
      };
    });

    const catalog = {
      bpp_id: `zapkirana-${storeId}`,
      bpp_uri: `https://api.zapkirana.in/ondc/${storeId}`,
      descriptor: { name: store.name, images: store.imageUrl ? [store.imageUrl] : [] },
      fulfillments: [
        {
          id: `f-${storeId}`,
          type: 'Delivery',
          start: {
            location: {
              gps: `${store.latitude},${store.longitude}`,
              address: { locality: store.location ?? '' },
            },
          },
        },
      ],
      items: ondcItems,
      itemCount: ondcItems.length,
      generatedAt: new Date().toISOString(),
    };

    return catalog;
  }

  /**
   * Automated Vendor Onboarding
   * Creates Organization, Store, and Owner User in a single transaction.
   */
  async onboardVendor(data: {
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    storeName: string;
    storeLocation: string;
    latitude?: number;
    longitude?: number;
    fssai?: string;
    gstin?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: `${data.storeName} Org`,
          legalName: data.storeName,
          gstin: data.gstin,
        },
      });

      // 2. Create Store
      const store = await tx.store.create({
        data: {
          organizationId: org.id,
          name: data.storeName,
          location: data.storeLocation,
          latitude: data.latitude,
          longitude: data.longitude,
          gstin: data.gstin,
          taxId: data.fssai,
        },
      });

      // 3. Create Owner User
      const user = await tx.user.create({
        data: {
          name: data.ownerName,
          email: data.ownerEmail,
          phone: data.ownerPhone,
          role: 'OWNER',
          organizationId: org.id,
          storeId: store.id,
        },
      });

      // 4. Assign Roles
      await tx.userStoreRole.create({
        data: {
          userId: user.id,
          storeId: store.id,
          organizationId: org.id,
          role: 'OWNER',
        },
      });

      return {
        message: 'Vendor successfully onboarded',
        organization: org,
        store,
        user,
      };
    });
  }
}
