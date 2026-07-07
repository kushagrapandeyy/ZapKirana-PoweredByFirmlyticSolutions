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
exports.ErpImportController = void 0;
const common_1 = require("@nestjs/common");
const erp_import_service_1 = require("./erp-import.service");
let ErpImportController = class ErpImportController {
    erpImportService;
    constructor(erpImportService) {
        this.erpImportService = erpImportService;
    }
    async dryRunProductImport(storeId, body) {
        return this.erpImportService.dryRunProductImport(storeId, body.rows, body.uploadedBy);
    }
    async confirmProductImport(storeId, body) {
        return this.erpImportService.confirmProductImport(storeId, body.batchId, body.confirmedBy);
    }
    async dryRunSupplierImport(storeId, body) {
        return this.erpImportService.dryRunSupplierImport(storeId, body.rows, body.uploadedBy);
    }
};
exports.ErpImportController = ErpImportController;
__decorate([
    (0, common_1.Post)(':storeId/product-master/dry-run'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ErpImportController.prototype, "dryRunProductImport", null);
__decorate([
    (0, common_1.Post)(':storeId/product-master/confirm'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ErpImportController.prototype, "confirmProductImport", null);
__decorate([
    (0, common_1.Post)(':storeId/ledger-master/dry-run'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ErpImportController.prototype, "dryRunSupplierImport", null);
exports.ErpImportController = ErpImportController = __decorate([
    (0, common_1.Controller)('erp-import'),
    __metadata("design:paramtypes", [erp_import_service_1.ErpImportService])
], ErpImportController);
//# sourceMappingURL=erp-import.controller.js.map