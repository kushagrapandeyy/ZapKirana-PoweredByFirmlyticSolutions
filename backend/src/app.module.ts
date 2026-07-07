import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { PosModule } from './pos/pos.module';
import { OrdersModule } from './orders/orders.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PrismaService } from './prisma.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ProcurementModule } from './procurement/procurement.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { GstModule } from './gst/gst.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PlatformModule } from './platform/platform.module';
import { StorageModule } from './storage/storage.module';
import { ScannerModule } from './scanner/scanner.module';
import { PaymentsModule } from './payments/payments.module';
import { LabelsModule } from './labels/labels.module';
import { CatalogModule } from './catalog/catalog.module';
import { AddressesModule } from './addresses/addresses.module';

// Guards & Interceptors & Filters
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { StoreScopeGuard } from './common/guards/store-scope.guard';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ScannerManagementModule } from './scanner-management/scanner-management.module';
import { CartModule } from './cart/cart.module';
import { CacheModule } from './cache/cache.module';
import { RealtimeModule } from './realtime/realtime.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { SupportModule } from './support/support.module';
import { TillModule } from './till/till.module';
import { LedgerModule } from './ledger/ledger.module';
import { EventsModule } from './common/events/events.module';
import { BullModule } from '@nestjs/bullmq';
import { OfflineSyncModule } from './offline-sync/offline-sync.module';
import { AdminGovernanceModule } from './admin-governance/admin-governance.module';
import { ErpImportModule } from './erp-import/erp-import.module';
import { GeminiModule } from './gemini/gemini.module';

const queueDriver = process.env.QUEUE_DRIVER || 'memory';
const conditionalModules = [];
if (queueDriver === 'redis') {
  conditionalModules.push(
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    })
  );
}

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // global rate limit
    }]),
    ...conditionalModules,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    InventoryModule, 
    ProductsModule,
    PosModule,
    OrdersModule,
    SuppliersModule,
    AdminModule,
    AuthModule,
    ProcurementModule,
    NotificationsModule,
    SubscriptionsModule,
    GstModule,
    AnalyticsModule,
    DeliveryModule,
    PlatformModule,
    StorageModule,
    ScannerModule,
    PaymentsModule,
    LabelsModule,
    CatalogModule,
    ScannerManagementModule,
    CartModule,
    AddressesModule,
    CacheModule,
    RealtimeModule,
    CampaignsModule,
    SupportModule,
    TillModule,
    LedgerModule,
    EventsModule,
    OfflineSyncModule,
    AdminGovernanceModule,
    ErpImportModule,
    GeminiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

