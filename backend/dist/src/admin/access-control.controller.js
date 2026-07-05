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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let AccessControlController = class AccessControlController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPlatformStaff() {
        return this.prisma.user.findMany({
            where: {
                role: {
                    in: ['ORG_ADMIN', 'OWNER', 'MANAGER']
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            }
        });
    }
    async inviteStaff(body, req) {
        const user = await this.prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                role: body.role,
                password: 'defaultPassword123',
            }
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'INVITE_STAFF',
                entityType: 'User',
                entityId: user.id,
                userId: req.user.id,
                details: `Invited ${body.name} as ${body.role}`,
            }
        });
        return user;
    }
    async updateRole(id, body, req) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { role: body.role }
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'UPDATE_STAFF_ROLE',
                entityType: 'User',
                entityId: user.id,
                userId: req.user.id,
                details: `Changed role of ${user.name} to ${body.role}`,
            }
        });
        return user;
    }
};
exports.AccessControlController = AccessControlController;
__decorate([
    (0, common_1.Get)('staff'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "getPlatformStaff", null);
__decorate([
    (0, common_1.Post)('invite'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "inviteStaff", null);
__decorate([
    (0, common_1.Patch)('staff/:id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "updateRole", null);
exports.AccessControlController = AccessControlController = __decorate([
    (0, common_1.Controller)('admin/access-control'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ORG_ADMIN),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccessControlController);
//# sourceMappingURL=access-control.controller.js.map