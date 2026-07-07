import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [RealtimeService, PrismaService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
