import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupportGateway, PrismaService, JwtService],
})
export class SupportModule {}
