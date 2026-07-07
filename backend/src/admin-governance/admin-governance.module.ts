import { Global, Module } from '@nestjs/common';
import { AdminGovernanceService } from './admin-governance.service';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [AdminGovernanceService, PrismaService],
  exports: [AdminGovernanceService],
})
export class AdminGovernanceModule {}
