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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getRevenue(storeId, from, to) {
        if (!storeId || !from || !to)
            throw new common_1.BadRequestException('storeId, from, and to are required');
        return this.analyticsService.getRevenue(storeId, from, to);
    }
    getTopProducts(storeId, limit = '10', days = '30') {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.analyticsService.getTopProducts(storeId, parseInt(limit), parseInt(days));
    }
    getInventoryHealth(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.analyticsService.getInventoryHealth(storeId);
    }
    getSupplierScorecard(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.analyticsService.getSupplierScorecard(storeId);
    }
    getHourlyHeatmap(storeId, days = '30') {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.analyticsService.getHourlyHeatmap(storeId, parseInt(days));
    }
    getCategoryMix(storeId, days = '30') {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.analyticsService.getCategoryMix(storeId, parseInt(days));
    }
    getNetworkSummary(from, to) {
        if (!from || !to)
            throw new common_1.BadRequestException('from and to are required');
        return this.analyticsService.getNetworkSummary(from, to);
    }
    getProfitAnalytics(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.analyticsService.getProfitAnalytics(storeId);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('revenue'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('top-products'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTopProducts", null);
__decorate([
    (0, common_1.Get)('inventory-health'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getInventoryHealth", null);
__decorate([
    (0, common_1.Get)('supplier-scorecard'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSupplierScorecard", null);
__decorate([
    (0, common_1.Get)('hourly-heatmap'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getHourlyHeatmap", null);
__decorate([
    (0, common_1.Get)('category-mix'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getCategoryMix", null);
__decorate([
    (0, common_1.Get)('network-summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getNetworkSummary", null);
__decorate([
    (0, common_1.Get)('profit'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getProfitAnalytics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map