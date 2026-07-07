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
exports.GstController = void 0;
const common_1 = require("@nestjs/common");
const gst_service_1 = require("./gst.service");
let GstController = class GstController {
    gstService;
    constructor(gstService) {
        this.gstService = gstService;
    }
    seedRules() {
        return this.gstService.seedDefaultRules();
    }
    getRules() {
        return this.gstService.getRules();
    }
    upsertRule(body) {
        return this.gstService.upsertRule(body.category, body.gstClass, body.gstRate);
    }
    deleteRule(id) {
        return this.gstService.deleteRule(id);
    }
    classifyProduct(productId) {
        return this.gstService.classifyProduct(productId);
    }
    bulkClassify(storeId) {
        return this.gstService.bulkClassify(storeId);
    }
    getReport(storeId, startDate, endDate) {
        return this.gstService.getGSTReport(storeId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    }
};
exports.GstController = GstController;
__decorate([
    (0, common_1.Post)('rules/seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GstController.prototype, "seedRules", null);
__decorate([
    (0, common_1.Get)('rules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GstController.prototype, "getRules", null);
__decorate([
    (0, common_1.Post)('rules'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "upsertRule", null);
__decorate([
    (0, common_1.Delete)('rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "deleteRule", null);
__decorate([
    (0, common_1.Post)('classify/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "classifyProduct", null);
__decorate([
    (0, common_1.Post)('classify/bulk/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "bulkClassify", null);
__decorate([
    (0, common_1.Get)('report/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "getReport", null);
exports.GstController = GstController = __decorate([
    (0, common_1.Controller)('gst'),
    __metadata("design:paramtypes", [gst_service_1.GstService])
], GstController);
//# sourceMappingURL=gst.controller.js.map