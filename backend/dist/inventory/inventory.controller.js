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
const public_decorator_1 = require("../common/decorators/public.decorator");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async getProducts(storeId) {
        return this.inventoryService.getProducts(storeId);
    }
    async getClearanceProducts(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.inventoryService.getClearanceProducts(storeId);
    }
    async getNewProducts(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.inventoryService.getNewProducts(storeId);
    }
    receiveStock(body) {
        if (!body.storeId || !body.storeProductId || body.quantity == null) {
            throw new common_1.BadRequestException('storeId, storeProductId, and quantity are required');
        }
        return this.inventoryService.receiveStock(body.storeId, body.storeProductId, body.quantity, body.staffId, body.batchNo);
    }
    manualAdjustment(body) {
        if (!body.storeId || !body.storeProductId || body.quantityChange == null || !body.reason || !body.staffId) {
            throw new common_1.BadRequestException('storeId, storeProductId, quantityChange, reason, and staffId are required');
        }
        return this.inventoryService.recordMovement({
            storeId: body.storeId,
            storeProductId: body.storeProductId,
            type: client_1.MovementType.MANUAL_ADJUSTMENT,
            quantityChange: body.quantityChange,
            reason: body.reason,
            staffId: body.staffId,
        });
    }
    getAvailableStock(storeProductId, storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.inventoryService.getAvailableStock(storeId, storeProductId);
    }
    getMovementHistory(storeId, storeProductId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.inventoryService.getMovementHistory(storeId, storeProductId);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('clearance'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getClearanceProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('new'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getNewProducts", null);
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
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':storeProductId/available'),
    __param(0, (0, common_1.Param)('storeProductId')),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAvailableStock", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('storeProductId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getMovementHistory", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map