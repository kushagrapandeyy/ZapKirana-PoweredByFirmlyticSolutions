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
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../../prisma.service");
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    prisma;
    logger = new common_1.Logger(AuditInterceptor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, url, user, body, ip } = req;
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            const startTime = Date.now();
            return next.handle().pipe((0, operators_1.tap)({
                next: () => {
                    const duration = Date.now() - startTime;
                    this.logToDb(user?.id, user?.storeId, method, url, body, ip, duration, 'SUCCESS');
                },
                error: (err) => {
                    const duration = Date.now() - startTime;
                    this.logToDb(user?.id, user?.storeId, method, url, body, ip, duration, `ERROR: ${err.message}`);
                }
            }));
        }
        return next.handle();
    }
    async logToDb(userId, storeId, method, endpoint, payload, ip, durationMs, status) {
        try {
            const sanitizedPayload = { ...payload };
            if (sanitizedPayload.password)
                sanitizedPayload.password = '[REDACTED]';
            if (sanitizedPayload.otp)
                sanitizedPayload.otp = '[REDACTED]';
            this.logger.log(`AUDIT [${status}] ${method} ${endpoint} by ${userId || 'anonymous'} in ${durationMs}ms`);
        }
        catch (e) {
            this.logger.error(`Failed to write audit log: ${e.message}`);
        }
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map