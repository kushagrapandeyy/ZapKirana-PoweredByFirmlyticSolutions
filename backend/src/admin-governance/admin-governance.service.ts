import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminGovernanceService {
  private readonly logger = new Logger(AdminGovernanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log any destructive or override action performed by an admin.
   */
  async logIntervention(data: {
    adminUserId: string;
    targetType: string;
    targetId: string;
    storeId?: string;
    action: string;
    reason: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
    ipAddress?: string;
    deviceInfo?: string;
    requiresStoreNotification?: boolean;
  }) {
    this.logger.warn(`[ADMIN INTERVENTION] Admin ${data.adminUserId} performed ${data.action} on ${data.targetType}:${data.targetId}. Reason: ${data.reason}`);

    return this.prisma.adminInterventionLog.create({
      data: {
        adminUserId: data.adminUserId,
        targetType: data.targetType,
        targetId: data.targetId,
        storeId: data.storeId,
        action: data.action,
        reason: data.reason,
        beforeSnapshot: data.beforeSnapshot,
        afterSnapshot: data.afterSnapshot,
        ipAddress: data.ipAddress,
        deviceInfo: data.deviceInfo,
        requiresStoreNotification: data.requiresStoreNotification || false,
      },
    });
  }
}
