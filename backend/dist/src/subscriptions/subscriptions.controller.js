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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_service_1 = require("./subscriptions.service");
let SubscriptionsController = class SubscriptionsController {
    subscriptionsService;
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    create(body) {
        return this.subscriptionsService.createSubscription(body);
    }
    getAll(customerId) {
        return this.subscriptionsService.getSubscriptions(customerId);
    }
    getOne(id) {
        return this.subscriptionsService.getSubscriptionById(id);
    }
    pause(id) {
        return this.subscriptionsService.pauseSubscription(id);
    }
    resume(id) {
        return this.subscriptionsService.resumeSubscription(id);
    }
    updateItems(id, body) {
        return this.subscriptionsService.updateSubscriptionItems(id, body.items);
    }
    cancel(id) {
        return this.subscriptionsService.cancelSubscription(id);
    }
    processActive() {
        return this.subscriptionsService.processActiveSubscriptions();
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id/pause'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "pause", null);
__decorate([
    (0, common_1.Patch)(':id/resume'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "resume", null);
__decorate([
    (0, common_1.Patch)(':id/items'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "updateItems", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('process'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "processActive", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('subscriptions'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map