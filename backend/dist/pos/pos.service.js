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
exports.PosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const client_1 = require("@prisma/client");
const event_bus_service_1 = require("../common/events/event-bus.service");
const library_1 = require("@prisma/client/runtime/library");
let PosService = class PosService {
    prisma;
    inventoryService;
    eventBus;
    constructor(prisma, inventoryService, eventBus) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
        this.eventBus = eventBus;
    }
    async createDraftBill(storeId, staffId) {
        return this.prisma.posBill.create({
            data: { storeId, staffId, status: client_1.BillStatus.DRAFT },
        });
    }
    async resolveStoreProductForPOS(storeProductId) {
        const sp = await this.prisma.storeProduct.findUnique({
            where: { id: storeProductId },
            include: {
                product: { select: { name: true, hsnSacCode: true } },
                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                productBarcodes: { where: { isPrimary: true, isActive: true }, take: 1 },
                inventoryPolicy: true,
                discountPolicy: true,
            },
        });
        if (!sp)
            throw new common_1.NotFoundException(`StoreProduct ${storeProductId} not found`);
        const pricing = sp.pricing?.[0];
        const tax = sp.taxProfile?.[0];
        if (!pricing)
            throw new common_1.BadRequestException(`StoreProduct ${storeProductId} has no active pricing`);
        return { sp, pricing, tax };
    }
    async addItemToBill(billId, storeProductId, quantity) {
        const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
        if (!bill || bill.status !== client_1.BillStatus.DRAFT) {
            throw new common_1.BadRequestException('Bill not found or not in DRAFT state');
        }
        const { sp, pricing, tax } = await this.resolveStoreProductForPOS(storeProductId);
        const qty = new library_1.Decimal(quantity);
        const sellingPrice = pricing.sellingPrice ?? pricing.rateA ?? pricing.mrp ?? new library_1.Decimal(0);
        const mrp = pricing.mrp ?? sellingPrice;
        const cgstRate = tax?.cgstRate ?? new library_1.Decimal(0);
        const sgstRate = tax?.sgstRate ?? new library_1.Decimal(0);
        const igstRate = tax?.igstRate ?? new library_1.Decimal(0);
        const cessRate = tax?.cessRate ?? new library_1.Decimal(0);
        const totalGstRate = cgstRate.plus(sgstRate).plus(igstRate);
        let taxableValue;
        let cgstAmount;
        let sgstAmount;
        let igstAmount;
        let cessAmount;
        if (tax?.taxInclusive !== false && totalGstRate.greaterThan(0)) {
            taxableValue = sellingPrice.dividedBy(new library_1.Decimal(1).plus(totalGstRate.dividedBy(100))).times(qty);
        }
        else {
            taxableValue = sellingPrice.times(qty);
        }
        cgstAmount = taxableValue.times(cgstRate.dividedBy(100)).toDecimalPlaces(2);
        sgstAmount = taxableValue.times(sgstRate.dividedBy(100)).toDecimalPlaces(2);
        igstAmount = taxableValue.times(igstRate.dividedBy(100)).toDecimalPlaces(2);
        cessAmount = taxableValue.times(cessRate.dividedBy(100)).toDecimalPlaces(2);
        taxableValue = taxableValue.toDecimalPlaces(2);
        const totalLineAmount = sellingPrice.times(qty).toDecimalPlaces(2);
        const item = await this.prisma.posBillItem.create({
            data: {
                billId,
                storeProductId,
                quantity: qty,
                productNameSnapshot: sp.displayName ?? sp.product?.name,
                barcodeSnapshot: sp.productBarcodes?.[0]?.barcode,
                hsnSacCodeSnapshot: tax?.hsnSacCode ?? sp.product?.hsnSacCode,
                unitSnapshot: sp.inventoryPolicy?.saleUom ?? 'PCS',
                mrpSnapshot: mrp,
                sellingPriceSnapshot: sellingPrice,
                discountSnapshot: new library_1.Decimal(0),
                discountAmountSnapshot: new library_1.Decimal(0),
                taxableValueSnapshot: taxableValue,
                cgstRateSnapshot: cgstRate,
                cgstAmountSnapshot: cgstAmount,
                sgstRateSnapshot: sgstRate,
                sgstAmountSnapshot: sgstAmount,
                igstRateSnapshot: igstRate,
                igstAmountSnapshot: igstAmount,
                cessRateSnapshot: cessRate,
                cessAmountSnapshot: cessAmount,
                totalLineAmount,
            },
        });
        await this.recalculateBillTotals(billId);
        return item;
    }
    async addItemByBarcode(billId, storeId, barcode, quantity) {
        const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
        if (!bill || bill.status !== client_1.BillStatus.DRAFT) {
            throw new common_1.BadRequestException('Bill not found or not in DRAFT state');
        }
        const spBarcode = await this.prisma.storeProductBarcode.findFirst({
            where: { barcode, isActive: true, storeProduct: { storeId } },
            select: { storeProductId: true },
        });
        if (spBarcode) {
            return this.addItemToBill(billId, spBarcode.storeProductId, quantity);
        }
        const registry = await this.prisma.barcodeRegistry.findFirst({
            where: { barcodeValue: barcode, isActive: true, OR: [{ storeId }, { storeId: null }] },
            select: { storeProductId: true },
        });
        if (registry?.storeProductId) {
            return this.addItemToBill(billId, registry.storeProductId, quantity);
        }
        throw new common_1.NotFoundException(`No product found for barcode ${barcode} in store ${storeId}`);
    }
    async checkoutBill(billId, paymentMethod, amount, referenceId, customerId) {
        return this.prisma.$transaction(async (tx) => {
            const bill = await tx.posBill.findUnique({
                where: { id: billId },
                include: { items: true },
            });
            if (!bill || bill.status !== client_1.BillStatus.DRAFT) {
                throw new common_1.BadRequestException('Bill not found or already processed');
            }
            const payAmount = new library_1.Decimal(amount);
            const billTotal = new library_1.Decimal(bill.total);
            if (payAmount.lessThan(billTotal)) {
                throw new common_1.BadRequestException(`Insufficient payment. Total is ₹${billTotal.toFixed(2)}`);
            }
            if (paymentMethod === client_1.PaymentMethod.ZAPCREDIT) {
                if (!customerId)
                    throw new common_1.BadRequestException('customerId is required for ZapCredit payments');
                const customer = await tx.user.findUnique({ where: { id: customerId } });
                if (!customer)
                    throw new common_1.NotFoundException('Customer not found');
                const newBalance = new library_1.Decimal(customer.zapCreditBalance).minus(payAmount);
                await tx.user.update({
                    where: { id: customerId },
                    data: { zapCreditBalance: newBalance },
                });
                await tx.zapCreditLedger.create({
                    data: {
                        storeId: bill.storeId,
                        customerId,
                        staffId: bill.staffId,
                        amount: payAmount.negated(),
                        balanceAfter: newBalance,
                        note: `POS Checkout - Bill ${bill.id}`,
                        posBillId: bill.id,
                    },
                });
            }
            const updatedBill = await tx.posBill.update({
                where: { id: billId },
                data: { status: client_1.BillStatus.PAID },
            });
            await tx.posPayment.create({
                data: { billId, amount: payAmount, method: paymentMethod, referenceId },
            });
            if (paymentMethod === client_1.PaymentMethod.CASH) {
                const activeTill = await tx.till.findFirst({
                    where: { storeId: bill.storeId, status: 'OPEN' },
                });
                if (activeTill) {
                    await tx.tillTransaction.create({
                        data: { tillId: activeTill.id, type: 'SALE', amount: payAmount, reason: `POS Sale - Bill ${bill.id}` },
                    });
                    await tx.till.update({
                        where: { id: activeTill.id },
                        data: { expectedBalance: { increment: payAmount.toNumber() } },
                    });
                }
            }
            await this.eventBus.publish('pos.sale.completed', {
                storeId: bill.storeId,
                billId: bill.id,
                items: bill.items,
                staffId: bill.staffId,
                payment: { method: paymentMethod, amount: payAmount.toNumber() },
            });
            return updatedBill;
        });
    }
    async recalculateBillTotals(billId) {
        const items = await this.prisma.posBillItem.findMany({ where: { billId } });
        let subtotal = new library_1.Decimal(0);
        let gst = new library_1.Decimal(0);
        for (const item of items) {
            const lineTotal = new library_1.Decimal(item.totalLineAmount);
            const cgst = new library_1.Decimal(item.cgstAmountSnapshot ?? 0);
            const sgst = new library_1.Decimal(item.sgstAmountSnapshot ?? 0);
            const igst = new library_1.Decimal(item.igstAmountSnapshot ?? 0);
            const cess = new library_1.Decimal(item.cessAmountSnapshot ?? 0);
            subtotal = subtotal.plus(lineTotal);
            gst = gst.plus(cgst).plus(sgst).plus(igst).plus(cess);
        }
        const total = subtotal.toDecimalPlaces(2);
        const gstTotal = gst.toDecimalPlaces(2);
        await this.prisma.posBill.update({
            where: { id: billId },
            data: {
                subtotal: subtotal.minus(gstTotal).toDecimalPlaces(2),
                gst: gstTotal,
                total,
            },
        });
    }
    async getBill(billId) {
        const bill = await this.prisma.posBill.findUnique({
            where: { id: billId },
            include: {
                items: {
                    include: {
                        storeProduct: {
                            include: {
                                product: { select: { id: true, name: true } },
                                productBarcodes: { where: { isPrimary: true }, take: 1 },
                            },
                        },
                    },
                },
                payments: true,
                staff: { select: { id: true, name: true, role: true } },
            },
        });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        return bill;
    }
    async getCustomerByPhone(phone) {
        return this.prisma.user.findUnique({
            where: { phone },
            select: { id: true, name: true, phone: true, zapCreditBalance: true },
        });
    }
    async getDailyBills(storeId, date) {
        const targetDate = date ?? new Date();
        const start = new Date(targetDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate);
        end.setHours(23, 59, 59, 999);
        return this.prisma.posBill.findMany({
            where: { storeId, status: 'PAID', createdAt: { gte: start, lte: end } },
            include: { items: true, payments: true, staff: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PosService = PosService;
exports.PosService = PosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService,
        event_bus_service_1.EventBusService])
], PosService);
//# sourceMappingURL=pos.service.js.map