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
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
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
const analytics_module_1 = require("./analytics/analytics.module");
const delivery_module_1 = require("./delivery/delivery.module");
const platform_module_1 = require("./platform/platform.module");
const storage_module_1 = require("./storage/storage.module");
const scanner_module_1 = require("./scanner/scanner.module");
const payments_module_1 = require("./payments/payments.module");
const labels_module_1 = require("./labels/labels.module");
const catalog_module_1 = require("./catalog/catalog.module");
const addresses_module_1 = require("./addresses/addresses.module");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const store_scope_guard_1 = require("./common/guards/store-scope.guard");
const audit_interceptor_1 = require("./common/audit/audit.interceptor");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const scanner_management_module_1 = require("./scanner-management/scanner-management.module");
const cart_module_1 = require("./cart/cart.module");
const cache_module_1 = require("./cache/cache.module");
const realtime_module_1 = require("./realtime/realtime.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const support_module_1 = require("./support/support.module");
const till_module_1 = require("./till/till.module");
const ledger_module_1 = require("./ledger/ledger.module");
const events_module_1 = require("./common/events/events.module");
const bullmq_1 = require("@nestjs/bullmq");
const offline_sync_module_1 = require("./offline-sync/offline-sync.module");
const admin_governance_module_1 = require("./admin-governance/admin-governance.module");
const erp_import_module_1 = require("./erp-import/erp-import.module");
const gemini_module_1 = require("./gemini/gemini.module");
const fulfillment_module_1 = require("./fulfillment/fulfillment.module");
const queueDriver = process.env.QUEUE_DRIVER || 'memory';
const conditionalModules = [];
if (queueDriver === 'redis') {
    conditionalModules.push(bullmq_1.BullModule.forRoot({
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        },
    }));
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            ...conditionalModules,
            event_emitter_1.EventEmitterModule.forRoot(),
            schedule_1.ScheduleModule.forRoot(),
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
            analytics_module_1.AnalyticsModule,
            delivery_module_1.DeliveryModule,
            platform_module_1.PlatformModule,
            storage_module_1.StorageModule,
            scanner_module_1.ScannerModule,
            payments_module_1.PaymentsModule,
            labels_module_1.LabelsModule,
            catalog_module_1.CatalogModule,
            scanner_management_module_1.ScannerManagementModule,
            cart_module_1.CartModule,
            addresses_module_1.AddressesModule,
            cache_module_1.CacheModule,
            realtime_module_1.RealtimeModule,
            campaigns_module_1.CampaignsModule,
            support_module_1.SupportModule,
            till_module_1.TillModule,
            ledger_module_1.LedgerModule,
            events_module_1.EventsModule,
            offline_sync_module_1.OfflineSyncModule,
            admin_governance_module_1.AdminGovernanceModule,
            erp_import_module_1.ErpImportModule,
            gemini_module_1.GeminiModule,
            fulfillment_module_1.FulfillmentModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            prisma_service_1.PrismaService,
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_interceptor_1.AuditInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: store_scope_guard_1.StoreScopeGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map