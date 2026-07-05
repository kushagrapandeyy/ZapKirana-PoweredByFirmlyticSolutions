import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupportGateway, PrismaService],
})
export class SupportModule {}
