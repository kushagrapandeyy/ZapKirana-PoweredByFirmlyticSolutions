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
let PosService = class PosService {
    prisma;
    inventoryService;
    constructor(prisma, inventoryService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
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
    async checkoutBill(billId, paymentMethod, amount, referenceId) {
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
            for (const item of bill.items) {
                await this.inventoryService.processPosSale(bill.storeId, item.productId, item.quantity, bill.id, bill.staffId);
            }
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
};
exports.PosService = PosService;
exports.PosService = PosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], PosService);
//# sourceMappingURL=pos.service.js.map