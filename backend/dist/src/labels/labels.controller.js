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
exports.LabelsController = void 0;
const common_1 = require("@nestjs/common");
const labels_service_1 = require("./labels.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let LabelsController = class LabelsController {
    labelsService;
    constructor(labelsService) {
        this.labelsService = labelsService;
    }
    generateBarcode(body) {
        return this.labelsService.generateBarcode(body);
    }
    registerExternal(body) {
        return this.labelsService.registerExternalBarcode(body);
    }
    getBarcodes(productId) {
        return this.labelsService.getBarcodesForProduct(productId);
    }
    createPrintJob(body) {
        return this.labelsService.createPrintJob(body);
    }
    getPrintJob(id) {
        return this.labelsService.getPrintJob(id);
    }
    listPrintJobs(storeId) {
        return this.labelsService.listPrintJobs(storeId);
    }
};
exports.LabelsController = LabelsController;
__decorate([
    (0, common_1.Post)('barcodes/generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LabelsController.prototype, "generateBarcode", null);
__decorate([
    (0, common_1.Post)('barcodes/register-external'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LabelsController.prototype, "registerExternal", null);
__decorate([
    (0, common_1.Get)('barcodes'),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabelsController.prototype, "getBarcodes", null);
__decorate([
    (0, common_1.Post)('print-jobs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LabelsController.prototype, "createPrintJob", null);
__decorate([
    (0, common_1.Get)('print-jobs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabelsController.prototype, "getPrintJob", null);
__decorate([
    (0, common_1.Get)('print-jobs'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabelsController.prototype, "listPrintJobs", null);
exports.LabelsController = LabelsController = __decorate([
    (0, common_1.Controller)('api/v1/labels'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [labels_service_1.LabelsService])
], LabelsController);
//# sourceMappingURL=labels.controller.js.map