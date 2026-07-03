"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ScannerManagementService = class ScannerManagementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getScannerStaff(storeId) {
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
                pin: true,
                createdAt: true
            }
        });
    }
    async createScannerStaff(storeId, data) {
        const email = `scanner_${Math.floor(Math.random() * 100000)}@basko.app`;
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
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
                        organizationId: store.organizationId,
                        role: 'SCANNER_STAFF'
                    }
                }
            }
        });
        return user;
    }
    async getDevices(storeId) {
        return this.prisma.scannerDevice.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async registerDevice(storeId, data) {
        return this.prisma.scannerDevice.create({
            data: {
                storeId,
                deviceName: data.deviceName,
                deviceCode: data.deviceCode,
                status: 'ACTIVE'
            }
        });
    }
    async getAnalytics(storeId) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todaySessions = await this.prisma.scannerSession.findMany({
            where: {
                storeId,
                startedAt: { gte: todayStart }
            }
        });
        const totalTimeSpentSeconds = todaySessions.reduce((acc, session) => acc + (session.durationSeconds || 0), 0);
        const scansToday = await this.prisma.scannerEvent.count({
            where: {
                storeId,
                createdAt: { gte: todayStart }
            }
        });
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
};
exports.ScannerManagementService = ScannerManagementService;
exports.ScannerManagementService = ScannerManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScannerManagementService);
//# sourceMappingURL=scanner-management.service.js.map