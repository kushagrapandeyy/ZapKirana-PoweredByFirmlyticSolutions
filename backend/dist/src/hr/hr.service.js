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
exports.HRService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let HRService = class HRService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStaffList(storeId) {
        const staffList = await this.prisma.user.findMany({
            where: { storeRoles: { some: { storeId } } },
            include: {
                storeRoles: true,
            }
        });
        const staffIds = staffList.map(s => s.id);
        const activeTimesheets = await this.prisma.timesheet.findMany({
            where: { staffId: { in: staffIds }, clockOut: null }
        });
        return staffList.map(staff => ({
            ...staff,
            timesheets: activeTimesheets.filter(ts => ts.staffId === staff.id)
        }));
    }
    async getTimesheets(storeId) {
        return this.prisma.timesheet.findMany({
            where: { storeId },
            include: { staff: true },
            orderBy: { clockIn: 'desc' },
            take: 50
        });
    }
    async getWageSlips(storeId) {
        return this.prisma.wageSlip.findMany({
            where: { storeId },
            include: { staff: true },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.HRService = HRService;
exports.HRService = HRService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HRService);
//# sourceMappingURL=hr.service.js.map