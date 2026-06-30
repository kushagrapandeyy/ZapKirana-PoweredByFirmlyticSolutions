import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { PosModule } from './pos/pos.module';
import { OrdersModule } from './orders/orders.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [InventoryModule, ProductsModule, PosModule, OrdersModule, SuppliersModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
