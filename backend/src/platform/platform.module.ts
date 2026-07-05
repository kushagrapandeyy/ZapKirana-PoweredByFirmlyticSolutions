import { Module } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { PrismaService } from '../prisma.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [PlatformService, PrismaService],
  controllers: [PlatformController],
  exports: [PlatformService],
})
export class PlatformModule {}
