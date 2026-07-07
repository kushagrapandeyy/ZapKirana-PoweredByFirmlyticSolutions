import { Module } from '@nestjs/common';
import { ErpImportController } from './erp-import.controller';
import { ErpImportService } from './erp-import.service';
import { ErpValidationService } from './erp-validation.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ErpImportController],
  providers: [ErpImportService, ErpValidationService, PrismaService],
  exports: [ErpImportService, ErpValidationService],
})
export class ErpImportModule {}
