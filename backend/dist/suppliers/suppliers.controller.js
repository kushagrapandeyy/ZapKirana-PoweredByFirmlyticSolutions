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
exports.SuppliersController = void 0;
const common_1 = require("@nestjs/common");
const suppliers_service_1 = require("./suppliers.service");
let SuppliersController = class SuppliersController {
    suppliersService;
    constructor(suppliersService) {
        this.suppliersService = suppliersService;
    }
    listLedgers(storeId, accountGroup) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.suppliersService.listLedgers(storeId, { accountGroup });
    }
    createLedger(body) {
        if (!body.storeId)
            throw new common_1.BadRequestException('storeId is required');
        const { storeId, ...payload } = body;
        return this.suppliersService.createLedger(storeId, payload);
    }
    getLedgerView(id) {
        return this.suppliersService.getLedgerView(id);
    }
    updateLedger(id, body) {
        if (!body.storeId)
            throw new common_1.BadRequestException('storeId is required');
        const { storeId, ...payload } = body;
        return this.suppliersService.updateLedger(id, storeId, payload);
    }
    getAllSuppliers() {
        return this.suppliersService.getAllSuppliers();
    }
    getStoreConnections(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.suppliersService.getStoreConnections(storeId);
    }
    connectStoreToSupplier(body) {
        if (!body.storeId || !body.supplierId) {
            throw new common_1.BadRequestException('storeId and supplierId are required');
        }
        return this.suppliersService.connectStoreToSupplier(body.storeId, body.supplierId);
    }
};
exports.SuppliersController = SuppliersController;
__decorate([
    (0, common_1.Get)('ledger'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('accountGroup')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "listLedgers", null);
__decorate([
    (0, common_1.Post)('ledger'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "createLedger", null);
__decorate([
    (0, common_1.Get)('ledger/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "getLedgerView", null);
__decorate([
    (0, common_1.Patch)('ledger/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "updateLedger", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "getAllSuppliers", null);
__decorate([
    (0, common_1.Get)('connections'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "getStoreConnections", null);
__decorate([
    (0, common_1.Post)('connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "connectStoreToSupplier", null);
exports.SuppliersController = SuppliersController = __decorate([
    (0, common_1.Controller)('suppliers'),
    __metadata("design:paramtypes", [suppliers_service_1.SuppliersService])
], SuppliersController);
//# sourceMappingURL=suppliers.controller.js.map