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
exports.PlatformController = void 0;
const common_1 = require("@nestjs/common");
const platform_service_1 = require("./platform.service");
let PlatformController = class PlatformController {
    platformService;
    constructor(platformService) {
        this.platformService = platformService;
    }
    getNearbyStores(lat, lng, radiusKm = '5') {
        if (!lat || !lng)
            throw new common_1.BadRequestException('lat and lng are required');
        return this.platformService.getNearbyStores(parseFloat(lat), parseFloat(lng), parseFloat(radiusKm));
    }
    searchCatalog(q, lat, lng, radiusKm = '5') {
        if (!q || !lat || !lng)
            throw new common_1.BadRequestException('q, lat, and lng are required');
        return this.platformService.searchCatalog(q, parseFloat(lat), parseFloat(lng), parseFloat(radiusKm));
    }
    searchByBarcode(code, lat, lng, radiusKm = '5') {
        if (!lat || !lng)
            throw new common_1.BadRequestException('lat and lng are required');
        return this.platformService.searchByBarcode(code, parseFloat(lat), parseFloat(lng), parseFloat(radiusKm));
    }
    syncOndcCatalog(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.platformService.buildOndcCatalog(storeId);
    }
    previewOndcCatalog(storeId) {
        return this.platformService.buildOndcCatalog(storeId);
    }
    async onboardVendor(body) {
        return this.platformService.onboardVendor(body);
    }
};
exports.PlatformController = PlatformController;
__decorate([
    (0, common_1.Get)('stores/nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radiusKm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "getNearbyStores", null);
__decorate([
    (0, common_1.Get)('catalog/search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('lat')),
    __param(2, (0, common_1.Query)('lng')),
    __param(3, (0, common_1.Query)('radiusKm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "searchCatalog", null);
__decorate([
    (0, common_1.Get)('catalog/barcode/:code'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Query)('lat')),
    __param(2, (0, common_1.Query)('lng')),
    __param(3, (0, common_1.Query)('radiusKm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "searchByBarcode", null);
__decorate([
    (0, common_1.Post)('ondc/sync'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "syncOndcCatalog", null);
__decorate([
    (0, common_1.Get)('ondc/catalog/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "previewOndcCatalog", null);
__decorate([
    (0, common_1.Post)('vendors/onboard'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "onboardVendor", null);
exports.PlatformController = PlatformController = __decorate([
    (0, common_1.Controller)('platform'),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], PlatformController);
//# sourceMappingURL=platform.controller.js.map