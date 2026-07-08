"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(data) {
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        if (data.phone) {
            const phoneExists = await this.prisma.user.findFirst({ where: { phone: data.phone } });
            if (phoneExists)
                throw new common_1.ConflictException('Phone number already registered');
        }
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone || null,
                role: 'CUSTOMER',
                isVerified: false,
            },
        });
        const { password, ...result } = user;
        return this.login(result);
    }
    async validateUser(identifier, pass) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier }
                ]
            }
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(pass, user.password);
        if (isMatch) {
            const { password, ...result } = user;
            return result;
        }
        throw new common_1.UnauthorizedException('Invalid credentials');
    }
    async requestOtp(phone) {
        const code = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        let user = await this.prisma.user.findFirst({ where: { phone } });
        await this.prisma.otpCode.create({
            data: {
                userId: user?.id || null,
                phone,
                code,
                expiresAt,
            },
        });
        if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
            try {
                const msg91Url = `https://control.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=${phone.replace('+', '')}&authkey=${process.env.MSG91_AUTH_KEY}&otp=${code}`;
                const res = await fetch(msg91Url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const json = await res.json();
                if (json.type === 'error') {
                    console.error(`MSG91 Error: ${json.message}`);
                }
            }
            catch (err) {
                console.error(`Failed to send OTP via MSG91:`, err);
            }
        }
        else {
            this.logger.warn(`[DEV MODE] OTP for ${phone}: ${code} — configure MSG91_API_KEY for production SMS delivery`);
        }
        return {
            message: 'OTP sent successfully',
            expiresIn: 300,
        };
    }
    async verifyOtp(phone, code) {
        const otpRecord = await this.prisma.otpCode.findFirst({
            where: {
                phone,
                code,
                isUsed: false,
                expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otpRecord) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        await this.prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        });
        let user = await this.prisma.user.findFirst({ where: { phone } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: `${phone}@phone.zapkirana.app`,
                    phone,
                    role: 'CUSTOMER',
                    isVerified: true,
                },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true },
            });
        }
        const { password, ...result } = user;
        return this.login(result);
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id, role: user.role, storeId: user.storeId };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                storeId: user.storeId,
                isVerified: user.isVerified,
                avatarUrl: user.avatarUrl,
            }
        };
    }
    async updatePushToken(userId, pushToken) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });
    }
    async scannerLogin(deviceCode, pin) {
        const device = await this.prisma.scannerDevice.findUnique({ where: { deviceCode } });
        if (!device)
            throw new common_1.UnauthorizedException('Invalid device code');
        if (device.status !== 'ACTIVE')
            throw new common_1.UnauthorizedException('Device inactive');
        const user = await this.prisma.user.findFirst({
            where: {
                pin,
                OR: [
                    { storeId: device.storeId },
                    { storeRoles: { some: { storeId: device.storeId } } }
                ]
            }
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid PIN');
        const activeDeviceSessions = await this.prisma.scannerSession.findMany({
            where: { deviceId: device.id, endedAt: null }
        });
        for (const s of activeDeviceSessions) {
            const durationSeconds = Math.floor((Date.now() - s.startedAt.getTime()) / 1000);
            await this.prisma.scannerSession.update({
                where: { id: s.id },
                data: { endedAt: new Date(), durationSeconds }
            });
        }
        const activeUserSessions = await this.prisma.scannerSession.findMany({
            where: { staffId: user.id, endedAt: null }
        });
        for (const s of activeUserSessions) {
            const durationSeconds = Math.floor((Date.now() - s.startedAt.getTime()) / 1000);
            await this.prisma.scannerSession.update({
                where: { id: s.id },
                data: { endedAt: new Date(), durationSeconds }
            });
        }
        const session = await this.prisma.scannerSession.create({
            data: {
                storeId: device.storeId,
                deviceId: device.id,
                staffId: user.id,
            }
        });
        const payload = { email: user.email, sub: user.id, role: user.role, storeId: device.storeId, sessionId: session.id };
        return {
            token: this.jwtService.sign(payload),
            storeId: device.storeId,
            deviceId: device.id,
            staffId: user.id,
            sessionId: session.id,
            user: {
                id: user.id,
                name: user.name,
            }
        };
    }
    async scannerLogout(sessionId, userId) {
        const session = await this.prisma.scannerSession.findUnique({ where: { id: sessionId } });
        if (!session || session.staffId !== userId || session.endedAt) {
            return { success: true };
        }
        const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
        await this.prisma.scannerSession.update({
            where: { id: sessionId },
            data: { endedAt: new Date(), durationSeconds }
        });
        return { success: true };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                savedAddresses: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const { password, ...result } = user;
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map