import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AccessControlController } from './access-control.controller';

import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminController, AccessControlController],
  providers: [AdminService, PrismaService]
})
export class AdminModule {}
