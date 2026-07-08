"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const gst_utils_1 = require("../common/gst/gst.utils");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(storeId, opts) {
        return this.prisma.storeProduct.findMany({
            where: {
                storeId,
                ...(opts?.includeHidden ? {} : { isHidden: false }),
                ...(opts?.includeInactive ? {} : { status: { not: 'INACTIVE' } }),
            },
            include: {
                product: { include: { brand: true, manufacturer: true, category: true } },
                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                inventoryPolicy: true,
                discountPolicy: true,
                rackLocations: true,
                productBarcodes: { where: { isActive: true } },
                stockBalances: true,
            },
            orderBy: { displayName: 'asc' },
        });
    }
    async findOne(storeProductId) {
        const sp = await this.prisma.storeProduct.findUnique({
            where: { id: storeProductId },
            include: {
                product: { include: { brand: true, manufacturer: true, category: true } },
                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                inventoryPolicy: true,
                discountPolicy: true,
                schemes: { where: { isActive: true } },
                rackLocations: true,
                productBarcodes: { where: { isActive: true } },
                priceHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
                costHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
                stockBalances: true,
                inventory: true,
            },
        });
        if (!sp)
            throw new common_1.NotFoundException(`StoreProduct ${storeProductId} not found`);
        return sp;
    }
    async findByBarcode(storeId, barcode) {
        const spBarcode = await this.prisma.storeProductBarcode.findFirst({
            where: { barcode, isActive: true, storeProduct: { storeId } },
            include: {
                storeProduct: {
                    include: {
                        product: { include: { brand: true, category: true } },
                        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                        taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                        inventoryPolicy: true,
                        stockBalances: true,
                    },
                },
            },
        });
        if (spBarcode)
            return spBarcode.storeProduct;
        const registry = await this.prisma.barcodeRegistry.findFirst({
            where: { barcodeValue: barcode, isActive: true, OR: [{ storeId }, { storeId: null }] },
            include: { storeProduct: { include: { pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 } } } },
        });
        if (registry?.storeProduct)
            return registry.storeProduct;
        throw new common_1.NotFoundException(`Barcode ${barcode} not found in store ${storeId}`);
    }
    async findOneMaster(storeProductId) {
        const sp = await this.prisma.storeProduct.findUnique({
            where: { id: storeProductId },
            include: {
                product: {
                    include: {
                        brand: true,
                        manufacturer: true,
                        category: true,
                    },
                },
                group: true,
                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                inventoryPolicy: true,
                discountPolicy: true,
                schemes: { where: { isActive: true } },
                rackLocations: true,
                productBarcodes: { where: { isActive: true } },
                priceHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
                costHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
                stockBalances: true,
            },
        });
        if (!sp)
            throw new common_1.NotFoundException(`StoreProduct ${storeProductId} not found`);
        return sp;
    }
    validateMaster(data) {
        const errors = [];
        const cgst = Number(data.taxProfile?.cgstRate ?? 0);
        const sgst = Number(data.taxProfile?.sgstRate ?? 0);
        const igst = Number(data.taxProfile?.igstRate ?? 0);
        const gstTotal = cgst + sgst;
        if (cgst > 0 && sgst > 0 && Math.abs(cgst - sgst) > 0.001) {
            errors.push('CGST and SGST should be equal for local sales (each = GST/2).');
        }
        if (igst > 0 && Math.abs(igst - gstTotal) > 0.001) {
            errors.push('IGST must equal CGST + SGST for interstate transactions.');
        }
        const mrp = Number(data.pricing?.mrp ?? 0);
        const selling = Number(data.pricing?.sellingPrice ?? mrp);
        const purchaseRate = Number(data.pricing?.purchaseRate ?? 0);
        if (mrp > 0 && selling > mrp) {
            errors.push('Selling price cannot exceed MRP unless rate override is explicitly allowed.');
        }
        if (purchaseRate > 0 && mrp > 0 && purchaseRate > mrp) {
            errors.push('Purchase rate is higher than MRP — confirm this is intentional.');
        }
        if (data.taxProfile?.hsnSacCode && /^\d+$/.test(data.taxProfile.hsnSacCode) === false) {
            errors.push('HSN/SAC code should contain only digits (stored as a string to preserve leading zeros).');
        }
        let gstPreview = null;
        if (mrp > 0 && gstTotal > 0) {
            const taxInclusive = data.taxProfile?.taxInclusive !== false;
            if (taxInclusive) {
                const taxableValue = mrp / (1 + gstTotal / 100);
                const gstAmount = mrp - taxableValue;
                gstPreview = {
                    mrp,
                    taxInclusive,
                    gstRate: gstTotal,
                    cgstRate: cgst,
                    sgstRate: sgst,
                    igstRate: igst,
                    taxableValue: Math.round(taxableValue * 100) / 100,
                    gstAmount: Math.round(gstAmount * 100) / 100,
                    finalSalePrice: mrp,
                };
            }
            else {
                const gstAmount = mrp * gstTotal / 100;
                gstPreview = {
                    mrp,
                    taxInclusive,
                    gstRate: gstTotal,
                    cgstRate: cgst,
                    sgstRate: sgst,
                    igstRate: igst,
                    taxableValue: mrp,
                    gstAmount: Math.round(gstAmount * 100) / 100,
                    finalSalePrice: Math.round((mrp + gstAmount) * 100) / 100,
                };
            }
        }
        return { valid: errors.length === 0, errors, gstPreview };
    }
    async updateMaster(storeProductId, data, updatedBy) {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.storeProduct.findUnique({ where: { id: storeProductId } });
            if (!existing)
                throw new common_1.NotFoundException('StoreProduct not found');
            if (data.storeProduct) {
                await tx.storeProduct.update({
                    where: { id: storeProductId },
                    data: {
                        displayName: data.storeProduct.displayName,
                        status: data.storeProduct.status,
                        type: data.storeProduct.type,
                        itemType: data.storeProduct.itemType,
                        isHidden: data.storeProduct.isHidden,
                        allowDecimalQty: data.storeProduct.allowDecimalQty,
                        packagingText: data.storeProduct.packagingText,
                        colorType: data.storeProduct.colorType,
                        manufacturerLegacyRef: data.storeProduct.manufacturerLegacyRef,
                        updatedBy,
                    },
                });
            }
            if (data.product) {
                await tx.product.update({
                    where: { id: existing.productId },
                    data: {
                        name: data.product.name,
                        baseUnit: data.product.baseUnit,
                        hsnSacCode: data.taxProfile?.hsnSacCode ?? data.product.hsnSacCode,
                        allowDecimalQuantity: data.storeProduct?.allowDecimalQty,
                    },
                });
            }
            if (data.pricing) {
                const prevPricing = await tx.storeProductPricing.findFirst({
                    where: { storeProductId },
                    orderBy: { effectiveFrom: 'desc' },
                });
                await tx.storeProductPricing.create({
                    data: {
                        storeProductId,
                        mrp: data.pricing.mrp != null ? new library_1.Decimal(data.pricing.mrp) : undefined,
                        sellingPrice: data.pricing.sellingPrice != null ? new library_1.Decimal(data.pricing.sellingPrice) : undefined,
                        rateA: data.pricing.rateA != null ? new library_1.Decimal(data.pricing.rateA) : undefined,
                        rateB: data.pricing.rateB != null ? new library_1.Decimal(data.pricing.rateB) : undefined,
                        rateC: data.pricing.rateC != null ? new library_1.Decimal(data.pricing.rateC) : undefined,
                        purchaseRate: data.pricing.purchaseRate != null ? new library_1.Decimal(data.pricing.purchaseRate) : undefined,
                        costPerPiece: data.pricing.costPerPiece != null ? new library_1.Decimal(data.pricing.costPerPiece) : undefined,
                        landingCost: data.pricing.landingCost != null ? new library_1.Decimal(data.pricing.landingCost) : undefined,
                        createdBy: updatedBy,
                    },
                });
                const fields = ['mrp', 'sellingPrice', 'rateA', 'rateB', 'rateC'];
                for (const field of fields) {
                    const newVal = data.pricing[field];
                    const oldVal = prevPricing ? Number(prevPricing[field] ?? 0) : null;
                    if (newVal != null && oldVal != null && Number(newVal) !== oldVal) {
                        await tx.productPriceHistory.create({
                            data: {
                                storeProductId,
                                changedField: field,
                                oldValue: new library_1.Decimal(oldVal),
                                newValue: new library_1.Decimal(newVal),
                                reason: 'manual_master_edit',
                                changedBy: updatedBy,
                            },
                        });
                    }
                }
            }
            if (data.taxProfile) {
                const cgst = data.taxProfile.cgstRate ?? 0;
                const sgst = data.taxProfile.sgstRate ?? 0;
                await tx.productTaxProfile.create({
                    data: {
                        storeProductId,
                        hsnSacCode: data.taxProfile.hsnSacCode,
                        localTaxabilityStatus: data.taxProfile.localTaxabilityStatus,
                        centralTaxabilityStatus: data.taxProfile.centralTaxabilityStatus,
                        isTaxable: data.taxProfile.isTaxable ?? cgst > 0,
                        taxInclusive: data.taxProfile.taxInclusive ?? true,
                        gstRate: cgst + sgst > 0 ? new library_1.Decimal(cgst + sgst) : undefined,
                        cgstRate: cgst > 0 ? new library_1.Decimal(cgst) : undefined,
                        sgstRate: sgst > 0 ? new library_1.Decimal(sgst) : undefined,
                        igstRate: data.taxProfile.igstRate != null ? new library_1.Decimal(data.taxProfile.igstRate) : undefined,
                        cessRate: data.taxProfile.cessRate != null ? new library_1.Decimal(data.taxProfile.cessRate) : undefined,
                        cessAmountPerUnit: data.taxProfile.cessAmountPerUnit != null ? new library_1.Decimal(data.taxProfile.cessAmountPerUnit) : undefined,
                        updatedBy,
                    },
                });
            }
            if (data.inventoryPolicy) {
                const ip = {
                    allowNegativeStock: data.inventoryPolicy.allowNegativeStock,
                    minimumQty: data.inventoryPolicy.minimumQty != null ? new library_1.Decimal(data.inventoryPolicy.minimumQty) : undefined,
                    maximumQty: data.inventoryPolicy.maximumQty != null ? new library_1.Decimal(data.inventoryPolicy.maximumQty) : undefined,
                    reorderQty: data.inventoryPolicy.reorderQty != null ? new library_1.Decimal(data.inventoryPolicy.reorderQty) : undefined,
                    defaultSaleQty: data.inventoryPolicy.defaultSaleQty != null ? new library_1.Decimal(data.inventoryPolicy.defaultSaleQty) : undefined,
                    boxConversionQty: data.inventoryPolicy.boxConversionQty != null ? new library_1.Decimal(data.inventoryPolicy.boxConversionQty) : undefined,
                    shelfLifeDays: data.inventoryPolicy.shelfLifeDays,
                    trackBatch: data.inventoryPolicy.trackBatch,
                    trackExpiry: data.inventoryPolicy.trackExpiry,
                    trackSerial: data.inventoryPolicy.trackSerial,
                    stockUom: data.inventoryPolicy.stockUom,
                    saleUom: data.inventoryPolicy.saleUom,
                    purchaseUom: data.inventoryPolicy.purchaseUom,
                    updatedBy,
                };
                await tx.productInventoryPolicy.upsert({
                    where: { storeProductId },
                    create: { storeProductId, ...ip },
                    update: ip,
                });
            }
            if (data.discountPolicy) {
                const dp = {
                    discountApplicable: data.discountPolicy.discountApplicable,
                    visibleDiscountOn: data.discountPolicy.visibleDiscountOn != null ? new library_1.Decimal(data.discountPolicy.visibleDiscountOn) : undefined,
                    itemDiscount1Percent: data.discountPolicy.itemDiscount1Percent != null ? new library_1.Decimal(data.discountPolicy.itemDiscount1Percent) : undefined,
                    itemDiscount2Percent: data.discountPolicy.itemDiscount2Percent != null ? new library_1.Decimal(data.discountPolicy.itemDiscount2Percent) : undefined,
                    specialDiscountPercent: data.discountPolicy.specialDiscountPercent != null ? new library_1.Decimal(data.discountPolicy.specialDiscountPercent) : undefined,
                    maximumDiscountPercent: data.discountPolicy.maximumDiscountPercent != null ? new library_1.Decimal(data.discountPolicy.maximumDiscountPercent) : undefined,
                    purchaseDiscountPercent: data.discountPolicy.purchaseDiscountPercent != null ? new library_1.Decimal(data.discountPolicy.purchaseDiscountPercent) : undefined,
                    discountLessPercent: data.discountPolicy.discountLessPercent != null ? new library_1.Decimal(data.discountPolicy.discountLessPercent) : undefined,
                    rateOverrideAllowed: data.discountPolicy.rateOverrideAllowed,
                    updatedBy,
                };
                await tx.productDiscountPolicy.upsert({
                    where: { storeProductId },
                    create: { storeProductId, ...dp },
                    update: dp,
                });
            }
            if (data.rack) {
                const existingRack = await tx.productRackLocation.findFirst({ where: { storeProductId } });
                if (existingRack) {
                    await tx.productRackLocation.update({
                        where: { id: existingRack.id },
                        data: {
                            rackNo: data.rack.rackNo,
                            shelfNo: data.rack.shelfNo,
                            binNo: data.rack.binNo,
                            zone: data.rack.zone,
                        },
                    });
                }
                else {
                    await tx.productRackLocation.create({
                        data: { storeProductId, ...data.rack },
                    });
                }
            }
            return this.findOneMaster(storeProductId);
        });
    }
    async createStoreProduct(data) {
        return this.prisma.$transaction(async (tx) => {
            let brandId;
            if (data.brandName) {
                const brand = await tx.brand.upsert({
                    where: { name: data.brandName.trim() },
                    create: { name: data.brandName.trim(), normalizedName: data.brandName.toLowerCase().trim() },
                    update: {},
                });
                brandId = brand.id;
            }
            let categoryId;
            if (data.categoryName) {
                const cat = await tx.globalCategory.upsert({
                    where: { name: data.categoryName.trim() },
                    create: { name: data.categoryName.trim() },
                    update: {},
                });
                categoryId = cat.id;
            }
            const existingProduct = await tx.product.findFirst({
                where: { name: data.name.trim(), ...(brandId ? { brandId } : {}) },
            });
            const product = existingProduct ?? await tx.product.create({
                data: {
                    name: data.name.trim(),
                    normalizedName: data.name.toLowerCase().trim(),
                    baseUnit: data.baseUnit ?? 'PCS',
                    brandId,
                    categoryId,
                    hsnSacCode: data.hsnSacCode,
                    allowDecimalQuantity: data.allowDecimalQty ?? false,
                },
            });
            const storeProduct = await tx.storeProduct.create({
                data: {
                    storeId: data.storeId,
                    productId: product.id,
                    legacyCode: data.legacyCode,
                    displayName: data.displayName ?? data.name,
                    status: data.status ?? 'ACTIVE',
                    type: data.type ?? 'NORMAL',
                    itemType: data.itemType,
                    isHidden: data.isHidden ?? false,
                    allowDecimalQty: data.allowDecimalQty ?? false,
                    packagingText: data.packagingText,
                    source: 'manual',
                    createdBy: data.createdBy,
                },
            });
            if (data.barcode) {
                await tx.storeProductBarcode.create({
                    data: { storeProductId: storeProduct.id, barcode: data.barcode, isPrimary: true, source: 'manual' },
                });
            }
            await tx.storeProductPricing.create({
                data: {
                    storeProductId: storeProduct.id,
                    mrp: data.mrp != null ? new library_1.Decimal(data.mrp) : undefined,
                    sellingPrice: data.sellingPrice != null ? new library_1.Decimal(data.sellingPrice) : (data.rateA != null ? new library_1.Decimal(data.rateA) : undefined),
                    rateA: data.rateA != null ? new library_1.Decimal(data.rateA) : undefined,
                    rateB: data.rateB != null ? new library_1.Decimal(data.rateB) : undefined,
                    rateC: data.rateC != null ? new library_1.Decimal(data.rateC) : undefined,
                    purchaseRate: data.purchaseRate != null ? new library_1.Decimal(data.purchaseRate) : undefined,
                    costPerPiece: data.costPerPiece != null ? new library_1.Decimal(data.costPerPiece) : undefined,
                    createdBy: data.createdBy,
                },
            });
            const cgst = data.cgstRate ?? 0;
            const sgst = data.sgstRate ?? 0;
            await tx.productTaxProfile.create({
                data: {
                    storeProductId: storeProduct.id,
                    hsnSacCode: data.hsnSacCode,
                    isTaxable: data.isTaxable ?? cgst > 0,
                    localTaxabilityStatus: data.localTaxabilityStatus ?? (cgst > 0 ? 'Taxable' : 'Exempt'),
                    centralTaxabilityStatus: data.centralTaxabilityStatus ?? (cgst > 0 ? 'Taxable' : 'Exempt'),
                    gstRate: cgst + sgst > 0 ? new library_1.Decimal(cgst + sgst) : undefined,
                    cgstRate: cgst > 0 ? new library_1.Decimal(cgst) : undefined,
                    sgstRate: sgst > 0 ? new library_1.Decimal(sgst) : undefined,
                    igstRate: data.igstRate != null ? new library_1.Decimal(data.igstRate) : undefined,
                    cessRate: data.cessRate != null ? new library_1.Decimal(data.cessRate) : undefined,
                    createdBy: data.createdBy,
                },
            });
            await tx.productInventoryPolicy.create({
                data: {
                    storeProductId: storeProduct.id,
                    allowNegativeStock: data.allowNegativeStock ?? false,
                    minimumQty: data.minimumQty != null ? new library_1.Decimal(data.minimumQty) : undefined,
                    maximumQty: data.maximumQty != null ? new library_1.Decimal(data.maximumQty) : undefined,
                    reorderQty: data.reorderQty != null ? new library_1.Decimal(data.reorderQty) : undefined,
                    defaultSaleQty: data.defaultSaleQty != null ? new library_1.Decimal(data.defaultSaleQty) : new library_1.Decimal(1),
                    boxConversionQty: data.boxConversionQty != null ? new library_1.Decimal(data.boxConversionQty) : undefined,
                    shelfLifeDays: data.shelfLifeDays,
                    stockUom: data.baseUnit ?? 'PCS',
                    saleUom: data.baseUnit ?? 'PCS',
                    purchaseUom: data.baseUnit ?? 'PCS',
                    createdBy: data.createdBy,
                },
            });
            if (data.rackNo) {
                await tx.productRackLocation.create({
                    data: { storeProductId: storeProduct.id, rackNo: data.rackNo },
                });
            }
            await tx.stockBalance.create({
                data: { storeId: data.storeId, storeProductId: storeProduct.id, balance: 0 },
            });
            return storeProduct;
        });
    }
    async updateStoreProduct(storeProductId, storeId, data) {
        const sp = await this.prisma.storeProduct.findFirst({ where: { id: storeProductId, storeId } });
        if (!sp)
            throw new common_1.NotFoundException('StoreProduct not found');
        return this.prisma.storeProduct.update({
            where: { id: storeProductId },
            data: {
                displayName: data.displayName,
                status: data.status,
                isHidden: data.isHidden,
                packagingText: data.packagingText,
                updatedBy: data.updatedBy,
            },
        });
    }
    async updatePricing(storeProductId, updatedBy, data) {
        return this.prisma.storeProductPricing.create({
            data: {
                storeProductId,
                mrp: data.mrp != null ? new library_1.Decimal(data.mrp) : undefined,
                sellingPrice: data.sellingPrice != null ? new library_1.Decimal(data.sellingPrice) : undefined,
                rateA: data.rateA != null ? new library_1.Decimal(data.rateA) : undefined,
                rateB: data.rateB != null ? new library_1.Decimal(data.rateB) : undefined,
                rateC: data.rateC != null ? new library_1.Decimal(data.rateC) : undefined,
                purchaseRate: data.purchaseRate != null ? new library_1.Decimal(data.purchaseRate) : undefined,
                costPerPiece: data.costPerPiece != null ? new library_1.Decimal(data.costPerPiece) : undefined,
                createdBy: updatedBy,
            },
        });
    }
    async enrichFromBarcode(barcode, storeId) {
        try {
            const local = await this.findByBarcode(storeId, barcode);
            if (local) {
                const pricing = local.pricing?.[0];
                const tax = local.taxProfile?.[0];
                return {
                    source: 'local_cache',
                    storeProductId: local.id,
                    name: local.displayName ?? local.product?.name,
                    brand: local.product?.brand?.name,
                    barcode,
                    mrp: pricing?.mrp ? Number(pricing.mrp) : 0,
                    sellingPrice: pricing?.sellingPrice ? Number(pricing.sellingPrice) : 0,
                    cgstRate: tax?.cgstRate ? Number(tax.cgstRate) : 0,
                    sgstRate: tax?.sgstRate ? Number(tax.sgstRate) : 0,
                };
            }
        }
        catch { }
        try {
            const res = await fetch(`${gst_utils_1.OPEN_FOOD_FACTS_URL}/${barcode}.json?fields=product_name,brands,categories,image_url`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 1 && data.product) {
                    const p = data.product;
                    const categoriesRaw = p.categories ?? '';
                    const gstClass = (0, gst_utils_1.inferGstClass)(categoriesRaw);
                    return {
                        source: 'open_food_facts',
                        barcode,
                        name: p.product_name ?? 'Unknown Product',
                        brand: p.brands ?? '',
                        category: categoriesRaw.split(',')[0]?.trim() ?? 'Grocery',
                        imageUrl: p.image_url ?? null,
                        mrp: 0,
                        sellingPrice: 0,
                        gstClass,
                        gstRate: gst_utils_1.GST_RATE_MAP[gstClass],
                    };
                }
            }
        }
        catch { }
        return { source: 'unknown', barcode, name: '', category: '', mrp: 0, sellingPrice: 0 };
    }
    async getPendingProducts(storeId) {
        return this.prisma.pendingProduct.findMany({
            where: { storeId, status: 'PENDING_REVIEW' },
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { name: true, role: true } } },
        });
    }
    async approvePendingProduct(id, approvedBy, data) {
        return this.prisma.$transaction(async (tx) => {
            const pending = await tx.pendingProduct.findUnique({ where: { id } });
            if (!pending)
                throw new common_1.BadRequestException('Pending product not found');
            if (pending.status !== 'PENDING_REVIEW')
                throw new common_1.BadRequestException('Already processed');
            let categoryId;
            if (data.category) {
                const cat = await tx.globalCategory.upsert({
                    where: { name: data.category.trim() },
                    create: { name: data.category.trim() },
                    update: {},
                });
                categoryId = cat.id;
            }
            const product = await tx.product.create({
                data: {
                    name: data.name,
                    normalizedName: data.name.toLowerCase(),
                    baseUnit: 'PCS',
                    categoryId,
                    hsnSacCode: data.hsnSacCode,
                },
            });
            const storeProduct = await tx.storeProduct.create({
                data: {
                    storeId: pending.storeId,
                    productId: product.id,
                    displayName: data.name,
                    status: 'ACTIVE',
                    source: 'approval',
                    createdBy: approvedBy,
                },
            });
            if (pending.barcode) {
                await tx.storeProductBarcode.create({
                    data: { storeProductId: storeProduct.id, barcode: pending.barcode, isPrimary: true, source: 'approval' },
                });
                await tx.barcodeRegistry.create({
                    data: {
                        storeId: pending.storeId,
                        storeProductId: storeProduct.id,
                        barcodeValue: pending.barcode,
                        barcodeScope: 'GS1_EXTERNAL_PRODUCT',
                    },
                });
            }
            await tx.storeProductPricing.create({
                data: {
                    storeProductId: storeProduct.id,
                    mrp: data.mrp != null ? new library_1.Decimal(data.mrp) : undefined,
                    sellingPrice: new library_1.Decimal(data.sellingPrice),
                    createdBy: approvedBy,
                },
            });
            const cgst = data.cgstRate ?? 0;
            const sgst = data.sgstRate ?? 0;
            await tx.productTaxProfile.create({
                data: {
                    storeProductId: storeProduct.id,
                    hsnSacCode: data.hsnSacCode,
                    isTaxable: cgst > 0,
                    gstRate: cgst + sgst > 0 ? new library_1.Decimal(cgst + sgst) : undefined,
                    cgstRate: cgst > 0 ? new library_1.Decimal(cgst) : undefined,
                    sgstRate: sgst > 0 ? new library_1.Decimal(sgst) : undefined,
                    createdBy: approvedBy,
                },
            });
            await tx.productInventoryPolicy.create({
                data: { storeProductId: storeProduct.id, allowNegativeStock: false, defaultSaleQty: new library_1.Decimal(1), createdBy: approvedBy },
            });
            await tx.stockBalance.create({
                data: { storeId: pending.storeId, storeProductId: storeProduct.id, balance: 0 },
            });
            await tx.pendingProduct.update({
                where: { id },
                data: { status: 'APPROVED', approvedProductId: storeProduct.id },
            });
            return storeProduct;
        });
    }
    async rejectPendingProduct(id) {
        const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
        if (!pending)
            throw new common_1.BadRequestException('Pending product not found');
        return this.prisma.pendingProduct.update({ where: { id }, data: { status: 'REJECTED' } });
    }
    async createPendingFromBarcode(data) {
        const enriched = await this.enrichFromBarcode(data.barcode, data.storeId);
        return this.prisma.pendingProduct.create({
            data: {
                storeId: data.storeId,
                barcode: data.barcode,
                suggestedName: data.suggestedName ?? enriched.name,
                suggestedCategory: enriched.category,
                mrp: data.mrp != null ? new library_1.Decimal(data.mrp) : null,
                sellingPrice: data.sellingPrice != null ? new library_1.Decimal(data.sellingPrice) : null,
                supplierId: data.supplierId,
                imageUrl: enriched.imageUrl,
                createdById: data.createdById,
                status: 'PENDING_REVIEW',
            },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map