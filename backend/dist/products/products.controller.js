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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
let ProductsController = class ProductsController {
    productsService;
    constructor(productsService) {
        this.productsService = productsService;
    }
    createProduct(body) {
        return this.productsService.createStoreProduct({
            ...body,
            createdBy: body.createdBy || 'API_USER',
        });
    }
    findAll(storeId) {
        if (!storeId) {
            return { error: 'storeId query parameter is required' };
        }
        return this.productsService.findAll(storeId);
    }
    findByBarcode(barcode, storeId) {
        if (!storeId) {
            return { error: 'storeId query parameter is required' };
        }
        return this.productsService.findByBarcode(storeId, barcode);
    }
    findOne(id) {
        return this.productsService.findOne(id);
    }
    findOneMaster(id) {
        return this.productsService.findOneMaster(id);
    }
    updateMaster(id, body) {
        const { updatedBy, ...payload } = body;
        return this.productsService.updateMaster(id, payload, updatedBy ?? 'API_USER');
    }
    validateMaster(body) {
        return this.productsService.validateMaster(body);
    }
    updatePrice(id, body) {
        return this.productsService.updatePricing(id, body.updatedBy || 'API_USER', body);
    }
    enrichBarcode(barcode, storeId) {
        if (!storeId)
            return { error: 'storeId is required' };
        return this.productsService.enrichFromBarcode(barcode, storeId);
    }
    createFromBarcode(body) {
        return this.productsService.createPendingFromBarcode({
            storeId: body.storeId,
            barcode: body.barcode,
            createdById: body.createdBy || 'API_USER',
            suggestedName: body.name,
            mrp: body.mrp,
            sellingPrice: body.sellingPrice,
            supplierId: body.supplierId,
        });
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('barcode/:barcode'),
    __param(0, (0, common_1.Param)('barcode')),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findByBarcode", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/master'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOneMaster", null);
__decorate([
    (0, common_1.Patch)(':id/master'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "updateMaster", null);
__decorate([
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "validateMaster", null);
__decorate([
    (0, common_1.Patch)(':id/price'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "updatePrice", null);
__decorate([
    (0, common_1.Get)('enrich/:barcode'),
    __param(0, (0, common_1.Param)('barcode')),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "enrichBarcode", null);
__decorate([
    (0, common_1.Post)('from-barcode'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "createFromBarcode", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map