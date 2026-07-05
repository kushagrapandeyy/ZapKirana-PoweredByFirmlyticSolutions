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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const catalog_service_1 = require("./catalog.service");
const human_approval_decorator_1 = require("../common/decorators/human-approval.decorator");
let CatalogController = class CatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    resolveBarcode(barcode, storeId) {
        return this.catalogService.resolveBarcode(barcode, storeId);
    }
    createPendingProduct(body) {
        return this.catalogService.createPendingProduct(body);
    }
    listPendingProducts(storeId, status) {
        return this.catalogService.listPendingProducts(storeId, status);
    }
    approvePendingProduct(id, body) {
        return this.catalogService.approvePendingProduct(id, body);
    }
    rejectPendingProduct(id, body) {
        return this.catalogService.rejectPendingProduct(id, body.reason);
    }
    getPersonalizedRecommendations(storeId, userId) {
        return this.catalogService.getPersonalizedRecommendations(storeId, userId);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('resolve-barcode/:barcode'),
    __param(0, (0, common_1.Param)('barcode')),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "resolveBarcode", null);
__decorate([
    (0, common_1.Post)('pending-products'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createPendingProduct", null);
__decorate([
    (0, common_1.Get)('pending-products'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listPendingProducts", null);
__decorate([
    (0, human_approval_decorator_1.HumanApprovalRequired)('Adding a new product to the central catalog requires vendor/manager validation of GST, HSN, and pricing.'),
    (0, common_1.Post)('pending-products/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "approvePendingProduct", null);
__decorate([
    (0, common_1.Post)('pending-products/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "rejectPendingProduct", null);
__decorate([
    (0, common_1.Get)('personalized'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getPersonalizedRecommendations", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('api/v1/catalog'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map