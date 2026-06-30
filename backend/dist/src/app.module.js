"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const inventory_module_1 = require("./inventory/inventory.module");
const products_module_1 = require("./products/products.module");
const pos_module_1 = require("./pos/pos.module");
const orders_module_1 = require("./orders/orders.module");
const suppliers_module_1 = require("./suppliers/suppliers.module");
const prisma_service_1 = require("./prisma.service");
const admin_module_1 = require("./admin/admin.module");
const auth_module_1 = require("./auth/auth.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const procurement_module_1 = require("./procurement/procurement.module");
const notifications_module_1 = require("./notifications/notifications.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const gst_module_1 = require("./gst/gst.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot(),
            inventory_module_1.InventoryModule,
            products_module_1.ProductsModule,
            pos_module_1.PosModule,
            orders_module_1.OrdersModule,
            suppliers_module_1.SuppliersModule,
            admin_module_1.AdminModule,
            auth_module_1.AuthModule,
            procurement_module_1.ProcurementModule,
            notifications_module_1.NotificationsModule,
            subscriptions_module_1.SubscriptionsModule,
            gst_module_1.GstModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map