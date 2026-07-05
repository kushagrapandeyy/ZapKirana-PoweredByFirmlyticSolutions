import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ScannerManagementService {
  constructor(private prisma: PrismaService) {}

  // 1. Staff Management
  async getScannerStaff(storeId: string) {
    return this.prisma.user.findMany({
      where: {
        storeRoles: { some: { storeId } },
        role: 'SCANNER_STAFF'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pin: true, // Only exposing for dev/admin simplicity, normally obfuscate
        createdAt: true
      }
    });
  }

  async createScannerStaff(storeId: string, data: { name: string; pin: string }) {
    const email = `scanner_${Math.floor(Math.random() * 100000)}@zapkirana.app`;
    
    // Find organizationId for this store
    const store = await this.prisma.store.findUnique({ where: { id: storeId }});
    if (!store) throw new NotFoundException('Store not found');

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email,
        pin: data.pin,
        role: 'SCANNER_STAFF',
        organizationId: store.organizationId,
        storeId,
        storeRoles: {
          create: {
            storeId,
            organizationId: store.organizationId!,
            role: 'SCANNER_STAFF'
          }
        }
      }
    });
    return user;
  }

  // 2. Device Management
  async getDevices(storeId: string) {
    return this.prisma.scannerDevice.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async registerDevice(storeId: string, data: { deviceName: string; deviceCode: string }) {
    return this.prisma.scannerDevice.create({
      data: {
        storeId,
        deviceName: data.deviceName,
        deviceCode: data.deviceCode,
        status: 'ACTIVE'
      }
    });
  }

  // 3. Analytics
  async getAnalytics(storeId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Time spent today (sum of durationSeconds from today's sessions)
    const todaySessions = await this.prisma.scannerSession.findMany({
      where: {
        storeId,
        startedAt: { gte: todayStart }
      }
    });

    const totalTimeSpentSeconds = todaySessions.reduce((acc, session) => acc + (session.durationSeconds || 0), 0);

    // Scans today
    const scansToday = await this.prisma.scannerEvent.count({
      where: {
        storeId,
        createdAt: { gte: todayStart }
      }
    });

    // Recent sessions
    const recentSessions = await this.prisma.scannerSession.findMany({
      where: { storeId },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        staff: { select: { name: true } },
        device: { select: { deviceName: true, deviceCode: true } }
      }
    });

    return {
      totalTimeSpentSeconds,
      scansToday,
      recentSessions
    };
  }

  async heartbeatDevice(storeId: string, deviceCode: string) {
    return this.prisma.scannerDevice.update({
      where: { deviceCode },
      data: {
        lastSeenAt: new Date()
      }
    }).catch(() => {
      throw new NotFoundException('Scanner device not found');
    });
  }
}
