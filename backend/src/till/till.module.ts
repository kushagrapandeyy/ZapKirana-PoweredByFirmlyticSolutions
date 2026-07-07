import { Module } from '@nestjs/common';
import { TillService } from './till.service';
import { TillController } from './till.controller';

@Module({
  providers: [TillService],
  controllers: [TillController],
  exports: [TillService],
})
export class TillModule {}
