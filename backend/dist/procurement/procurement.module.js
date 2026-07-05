"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementModule = void 0;
const common_1 = require("@nestjs/common");
const purchase_order_service_1 = require("./purchase-order/purchase-order.service");
const purchase_order_controller_1 = require("./purchase-order/purchase-order.controller");
const grn_service_1 = require("./grn/grn.service");
const prisma_service_1 = require("../prisma.service");
let ProcurementModule = class ProcurementModule {
};
exports.ProcurementModule = ProcurementModule;
exports.ProcurementModule = ProcurementModule = __decorate([
    (0, common_1.Module)({
        controllers: [purchase_order_controller_1.PurchaseOrderController],
        providers: [purchase_order_service_1.PurchaseOrderService, grn_service_1.GrnService, prisma_service_1.PrismaService],
        exports: [purchase_order_service_1.PurchaseOrderService, grn_service_1.GrnService]
    })
], ProcurementModule);
//# sourceMappingURL=procurement.module.js.map