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
exports.PurchaseOrderController = void 0;
const common_1 = require("@nestjs/common");
const purchase_order_service_1 = require("./purchase-order.service");
const grn_service_1 = require("../grn/grn.service");
let PurchaseOrderController = class PurchaseOrderController {
    poService;
    grnService;
    constructor(poService, grnService) {
        this.poService = poService;
        this.grnService = grnService;
    }
    async createPO(body) {
        return this.poService.createPO(body.storeId, body.supplierId, new Date(body.expectedDeliveryDate), body.items, body.notes);
    }
    async getStorePOs(storeId) {
        return this.poService.getPOs(storeId);
    }
    async getPO(id) {
        return this.poService.getPOById(id);
    }
    async getPOByShareToken(token) {
        return this.poService.getPOByShareToken(token);
    }
    async getPOPdf(id) {
        return this.poService.generatePOPdfHtml(id);
    }
    async acceptPO(id) {
        return this.poService.acceptPO(id);
    }
    async sendPO(id) {
        return this.poService.sendPO(id);
    }
    async completeGRN(id, body) {
        return this.grnService.receiveGoods(id, body.receivedItems, body.staffId);
    }
};
exports.PurchaseOrderController = PurchaseOrderController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "createPO", null);
__decorate([
    (0, common_1.Get)('store/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "getStorePOs", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "getPO", null);
__decorate([
    (0, common_1.Get)('share/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "getPOByShareToken", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, common_1.Header)('Content-Type', 'text/html'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "getPOPdf", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "acceptPO", null);
__decorate([
    (0, common_1.Patch)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "sendPO", null);
__decorate([
    (0, common_1.Post)(':id/grn'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "completeGRN", null);
exports.PurchaseOrderController = PurchaseOrderController = __decorate([
    (0, common_1.Controller)('purchase-orders'),
    __metadata("design:paramtypes", [purchase_order_service_1.PurchaseOrderService,
        grn_service_1.GrnService])
], PurchaseOrderController);
//# sourceMappingURL=purchase-order.controller.js.map