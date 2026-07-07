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
exports.ScannerController = void 0;
const common_1 = require("@nestjs/common");
const scanner_service_1 = require("./scanner.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ScannerController = class ScannerController {
    scannerService;
    constructor(scannerService) {
        this.scannerService = scannerService;
    }
    lookupBarcode(body) {
        return this.scannerService.lookupBarcode(body.storeId, body.barcode, body.scanMode);
    }
    updateProduct(productId, req, body) {
        const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
        return this.scannerService.updateProduct(userId, productId, body);
    }
    updateStock(req, body) {
        const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
        return this.scannerService.updateStock(userId, body);
    }
    createProductDraft(req, body) {
        const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
        return this.scannerService.createProductDraft(userId, body);
    }
};
exports.ScannerController = ScannerController;
__decorate([
    (0, common_1.Post)('barcode/lookup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "lookupBarcode", null);
__decorate([
    (0, common_1.Patch)('products/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Post)('stock/update'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "updateStock", null);
__decorate([
    (0, common_1.Post)('product-drafts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "createProductDraft", null);
exports.ScannerController = ScannerController = __decorate([
    (0, common_1.Controller)('scanner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [scanner_service_1.ScannerService])
], ScannerController);
//# sourceMappingURL=scanner.controller.js.map