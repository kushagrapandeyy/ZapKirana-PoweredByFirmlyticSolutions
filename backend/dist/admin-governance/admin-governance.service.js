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
var AdminGovernanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGovernanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AdminGovernanceService = AdminGovernanceService_1 = class AdminGovernanceService {
    prisma;
    logger = new common_1.Logger(AdminGovernanceService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logIntervention(data) {
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
};
exports.AdminGovernanceService = AdminGovernanceService;
exports.AdminGovernanceService = AdminGovernanceService = AdminGovernanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminGovernanceService);
//# sourceMappingURL=admin-governance.service.js.map