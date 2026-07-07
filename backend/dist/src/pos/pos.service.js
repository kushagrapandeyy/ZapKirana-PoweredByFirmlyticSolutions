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
            data: {
                storeId,
                staffId,
                status: client_1.BillStatus.DRAFT,
            },
        });
    }
    async addItemToBill(billId, productId, quantity) {
        const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
        if (!bill || bill.status !== client_1.BillStatus.DRAFT) {
            throw new common_1.BadRequestException('Bill not found or not in DRAFT state');
        }
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const priceAtSale = product.sellingPrice;
        const gstAtSale = product.gstRate;
        const item = await this.prisma.posBillItem.create({
            data: {
                billId,
                productId,
                quantity,
                priceAtSale,
                gstAtSale,
            },
        });
        await this.recalculateBillTotals(billId);
        return item;
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
            if (amount < bill.total) {
                throw new common_1.BadRequestException(`Insufficient payment. Total is ${bill.total}`);
            }
            if (paymentMethod === client_1.PaymentMethod.ZAPCREDIT) {
                if (!customerId) {
                    throw new common_1.BadRequestException('customerId is required for ZapCredit payments');
                }
                const customer = await tx.user.findUnique({ where: { id: customerId } });
                if (!customer)
                    throw new common_1.NotFoundException('Customer not found');
                const newBalance = customer.zapCreditBalance - amount;
                await tx.user.update({
                    where: { id: customerId },
                    data: { zapCreditBalance: newBalance }
                });
                await tx.zapCreditLedger.create({
                    data: {
                        storeId: bill.storeId,
                        customerId: customerId,
                        staffId: bill.staffId,
                        amount: -amount,
                        balanceAfter: newBalance,
                        note: `POS Checkout - Bill ${bill.id}`,
                        posBillId: bill.id,
                    }
                });
            }
            const updatedBill = await tx.posBill.update({
                where: { id: billId },
                data: { status: client_1.BillStatus.PAID },
            });
            await tx.posPayment.create({
                data: {
                    billId,
                    amount,
                    method: paymentMethod,
                    referenceId,
                },
            });
            if (paymentMethod === 'CASH') {
                const activeTill = await tx.till.findFirst({
                    where: { storeId: bill.storeId, status: 'OPEN' },
                });
                if (activeTill) {
                    await tx.tillTransaction.create({
                        data: {
                            tillId: activeTill.id,
                            type: 'SALE',
                            amount,
                            reason: `POS Sale - Bill ${bill.id}`,
                        },
                    });
                    await tx.till.update({
                        where: { id: activeTill.id },
                        data: { expectedBalance: { increment: amount } },
                    });
                }
            }
            await this.eventBus.publish('pos.sale.completed', {
                storeId: bill.storeId,
                billId: bill.id,
                items: bill.items,
                staffId: bill.staffId,
                payment: {
                    method: paymentMethod,
                    amount,
                }
            });
            return updatedBill;
        });
    }
    async recalculateBillTotals(billId) {
        const items = await this.prisma.posBillItem.findMany({ where: { billId } });
        let subtotal = 0;
        let gst = 0;
        for (const item of items) {
            const itemTotal = item.priceAtSale * item.quantity;
            subtotal += itemTotal;
            gst += itemTotal * (item.gstAtSale / 100);
        }
        const total = subtotal + gst;
        await this.prisma.posBill.update({
            where: { id: billId },
            data: { subtotal, gst, total },
        });
    }
    async getBill(billId) {
        const bill = await this.prisma.posBill.findUnique({
            where: { id: billId },
            include: {
                items: {
                    include: { product: { select: { id: true, name: true, barcode: true, imageUrl: true, category: true } } },
                },
                payments: true,
                staff: { select: { id: true, name: true, role: true } },
            },
        });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        return bill;
    }
    async addItemByBarcode(billId, storeId, barcode, quantity) {
        const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
        if (!bill || bill.status !== client_1.BillStatus.DRAFT) {
            throw new common_1.BadRequestException('Bill not found or not in DRAFT state');
        }
        const registryEntry = await this.prisma.barcodeRegistry.findFirst({
            where: { barcodeValue: barcode, isActive: true, OR: [{ storeId }, { storeId: null }] },
            include: { product: true },
        });
        let product = registryEntry?.product ?? null;
        if (!product) {
            product = await this.prisma.product.findFirst({
                where: { barcode, storeId, isActive: true },
            });
        }
        if (!product) {
            throw new common_1.NotFoundException(`No product found for barcode ${barcode} in this store`);
        }
        return this.addItemToBill(billId, product.id, quantity);
    }
    async getCustomerByPhone(phone) {
        return this.prisma.user.findUnique({
            where: { phone },
            select: { id: true, name: true, phone: true, zapCreditBalance: true }
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