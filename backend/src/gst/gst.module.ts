import { Module } from '@nestjs/common';
import { GstService } from './gst.service';
import { GstController } from './gst.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [GstService, PrismaService],
  controllers: [GstController],
  exports: [GstService],
})
export class GstModule {}
