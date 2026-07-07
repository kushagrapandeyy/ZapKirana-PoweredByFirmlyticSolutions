import { Module } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { PrismaService } from '../prisma.service';
import { CacheModule } from '../cache/cache.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { OcrService } from './ocr.service';

@Module({
  imports: [CacheModule, RealtimeModule],
  controllers: [ScannerController],
  providers: [ScannerService, PrismaService, OcrService],
  exports: [ScannerService],
})
export class ScannerModule {}
