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
exports.TillController = void 0;
const common_1 = require("@nestjs/common");
const till_service_1 = require("./till.service");
let TillController = class TillController {
    tillService;
    constructor(tillService) {
        this.tillService = tillService;
    }
    getActiveTill(storeId) {
        return this.tillService.getActiveTill(storeId);
    }
    openTill(body) {
        return this.tillService.openTill(body.storeId, body.openingBalance);
    }
    logTransaction(tillId, body) {
        return this.tillService.logTransaction(tillId, body.type, body.amount, body.reason);
    }
    closeTill(tillId, body) {
        return this.tillService.closeTill(tillId, body.actualClosingBalance);
    }
};
exports.TillController = TillController;
__decorate([
    (0, common_1.Get)('active/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TillController.prototype, "getActiveTill", null);
__decorate([
    (0, common_1.Post)('open'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TillController.prototype, "openTill", null);
__decorate([
    (0, common_1.Post)(':tillId/transaction'),
    __param(0, (0, common_1.Param)('tillId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TillController.prototype, "logTransaction", null);
__decorate([
    (0, common_1.Post)(':tillId/close'),
    __param(0, (0, common_1.Param)('tillId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TillController.prototype, "closeTill", null);
exports.TillController = TillController = __decorate([
    (0, common_1.Controller)('till'),
    __metadata("design:paramtypes", [till_service_1.TillService])
], TillController);
//# sourceMappingURL=till.controller.js.map