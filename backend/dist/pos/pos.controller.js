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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosController = void 0;
const common_1 = require("@nestjs/common");
const pos_service_1 = require("./pos.service");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let PosController = class PosController {
    posService;
    constructor(posService) {
        this.posService = posService;
    }
    createDraftBill(req, body) {
        if (!body.storeId) {
            throw new common_1.BadRequestException('storeId is required');
        }
        const staffId = req.user.id;
        return this.posService.createDraftBill(body.storeId, staffId);
    }
    addItemToBill(billId, body) {
        if (!body.productId || body.quantity == null || body.quantity <= 0) {
            throw new common_1.BadRequestException('Valid productId and quantity are required');
        }
        return this.posService.addItemToBill(billId, body.productId, body.quantity);
    }
    checkoutBill(billId, body) {
        if (!body.paymentMethod || body.amount == null) {
            throw new common_1.BadRequestException('paymentMethod and amount are required');
        }
        if (body.paymentMethod === client_1.PaymentMethod.ZAPCREDIT && !body.customerId) {
            throw new common_1.BadRequestException('customerId is required when paying with ZAPCREDIT');
        }
        return this.posService.checkoutBill(billId, body.paymentMethod, body.amount, body.referenceId, body.customerId);
    }
    getBill(billId) {
        return this.posService.getBill(billId);
    }
    addItemByBarcode(billId, body) {
        if (!body.barcode || !body.storeId) {
            throw new common_1.BadRequestException('barcode and storeId are required');
        }
        return this.posService.addItemByBarcode(billId, body.storeId, body.barcode, body.quantity ?? 1);
    }
    async getCustomerByPhone(phone) {
        const customer = await this.posService.getCustomerByPhone(phone);
        if (!customer) {
            throw new common_1.BadRequestException('Customer not found');
        }
        return customer;
    }
};
exports.PosController = PosController;
__decorate([
    (0, common_1.Post)('bill'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "createDraftBill", null);
__decorate([
    (0, common_1.Post)('bill/:id/items'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "addItemToBill", null);
__decorate([
    (0, common_1.Post)('bill/:id/checkout'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "checkoutBill", null);
__decorate([
    (0, common_1.Get)('bill/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "getBill", null);
__decorate([
    (0, common_1.Post)('bill/:id/items-by-barcode'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "addItemByBarcode", null);
__decorate([
    (0, common_1.Get)('customer/by-phone/:phone'),
    __param(0, (0, common_1.Param)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getCustomerByPhone", null);
exports.PosController = PosController = __decorate([
    (0, common_1.Controller)('pos'),
    (0, roles_decorator_1.Roles)('ORG_ADMIN', 'MANAGER', 'POS_CASHIER'),
    __metadata("design:paramtypes", [pos_service_1.PosService])
], PosController);
//# sourceMappingURL=pos.controller.js.map