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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const client_1 = require("@prisma/client");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    receiveStock(body) {
        if (!body.storeId || !body.productId || body.quantity == null) {
            throw new common_1.BadRequestException('storeId, productId, and quantity are required');
        }
        return this.inventoryService.receiveStock(body.storeId, body.productId, body.quantity, body.staffId, body.batchNo);
    }
    manualAdjustment(body) {
        if (!body.storeId || !body.productId || body.quantityChange == null || !body.reason || !body.staffId) {
            throw new common_1.BadRequestException('storeId, productId, quantityChange, reason, and staffId are required');
        }
        return this.inventoryService.recordMovement({
            storeId: body.storeId,
            productId: body.productId,
            type: client_1.MovementType.MANUAL_ADJUSTMENT,
            quantityChange: body.quantityChange,
            reason: body.reason,
            staffId: body.staffId,
        });
    }
    getAvailableStock(productId, storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.inventoryService.getAvailableStock(storeId, productId);
    }
    getMovementHistory(storeId, productId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.inventoryService.getMovementHistory(storeId, productId);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('receive'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "receiveStock", null);
__decorate([
    (0, common_1.Post)('adjust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "manualAdjustment", null);
__decorate([
    (0, common_1.Get)(':productId/available'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAvailableStock", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getMovementHistory", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map