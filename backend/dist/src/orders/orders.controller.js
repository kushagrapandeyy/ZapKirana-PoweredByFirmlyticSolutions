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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const public_decorator_1 = require("../common/decorators/public.decorator");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    getStoreOrders(storeId) {
        if (!storeId)
            throw new common_1.BadRequestException('storeId is required');
        return this.ordersService.getStoreOrders(storeId);
    }
    getOrderById(id) {
        return this.ordersService.getOrderById(id);
    }
    getCustomerOrders(customerId) {
        return this.ordersService.getCustomerOrders(customerId);
    }
    createOrder(body) {
        if (!body.storeId || !body.customerId || !body.items || body.items.length === 0) {
            throw new common_1.BadRequestException('Invalid order payload');
        }
        return this.ordersService.createOrder(body.storeId, body.customerId, body.items, body.delivery, body.requireOtp);
    }
    payOrder(id) {
        return this.ordersService.payOrder(id);
    }
    updateOrderStatus(id, status, staffId) {
        return this.ordersService.updateOrderStatus(id, status, staffId);
    }
    pickOrder(id, staffId) {
        if (!staffId)
            throw new common_1.BadRequestException('staffId required');
        return this.ordersService.pickOrder(id, staffId);
    }
    startDelivery(id, staffId) {
        if (!staffId)
            throw new common_1.BadRequestException('staffId required');
        return this.ordersService.startDelivery(id, staffId);
    }
    completeOrder(id, staffId, otp) {
        if (!staffId)
            throw new common_1.BadRequestException('staffId required');
        return this.ordersService.completeOrder(id, staffId, otp);
    }
    getOrderMessages(id) {
        return this.ordersService.getOrderMessages(id);
    }
    addOrderMessage(id, senderId, text) {
        if (!senderId || !text)
            throw new common_1.BadRequestException('senderId and text required');
        return this.ordersService.addOrderMessage(id, senderId, text);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getStoreOrders", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrderById", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('customer/:customerId'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getCustomerOrders", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':id/pay'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "payOrder", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateOrderStatus", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)(':id/pick'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "pickOrder", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)(':id/deliver'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "startDelivery", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('staffId')),
    __param(2, (0, common_1.Body)('otp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "completeOrder", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrderMessages", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('senderId')),
    __param(2, (0, common_1.Body)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "addOrderMessage", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map