import { Module } from '@nestjs/common';
import { DeliveryGateway } from './delivery.gateway';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [DeliveryGateway, DeliveryService, PrismaService],
  controllers: [DeliveryController],
  exports: [DeliveryGateway],
})
export class DeliveryModule {}
