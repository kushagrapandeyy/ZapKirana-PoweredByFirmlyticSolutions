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
    getWorkflows() {
        return this.scannerService.getWorkflows();
    }
    resolveBarcode(body) {
        return this.scannerService.resolveBarcode(body);
    }
    submitEvent(body) {
        return this.scannerService.submitScanEvent(body);
    }
    batchSync(body) {
        return this.scannerService.batchSync(body.storeId, body.deviceId, body.events);
    }
    getActivity(storeId, limit) {
        return this.scannerService.getScannerActivity(storeId, limit ? parseInt(limit, 10) : 50);
    }
    getDevices(storeId) {
        return this.scannerService.getDevices(storeId);
    }
    registerDevice(body) {
        return this.scannerService.registerDevice(body);
    }
    heartbeat(deviceId) {
        return this.scannerService.deviceHeartbeat(deviceId);
    }
};
exports.ScannerController = ScannerController;
__decorate([
    (0, common_1.Get)('workflows'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "getWorkflows", null);
__decorate([
    (0, common_1.Post)('resolve'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "resolveBarcode", null);
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "submitEvent", null);
__decorate([
    (0, common_1.Post)('sync/batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "batchSync", null);
__decorate([
    (0, common_1.Get)('activity'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Get)('devices'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Post)('devices'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Post)('devices/:deviceId/heartbeat'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "heartbeat", null);
exports.ScannerController = ScannerController = __decorate([
    (0, common_1.Controller)('api/v1/scanner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [scanner_service_1.ScannerService])
], ScannerController);
//# sourceMappingURL=scanner.controller.js.map