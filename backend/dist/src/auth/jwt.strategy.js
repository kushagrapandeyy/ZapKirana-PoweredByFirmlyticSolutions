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
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SUPABASE_JWT_SECRET || 'SUPER_SECRET_KEY',
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        let user = null;
        user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { id: payload.sub },
                    ...(payload.email ? [{ email: payload.email }] : []),
                    ...(payload.phone ? [{ phone: payload.phone }] : []),
                ]
            }
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    id: payload.sub,
                    email: payload.email || `${payload.phone || payload.sub}@phone.zapkirana.app`,
                    phone: payload.phone || null,
                    name: payload.user_metadata?.name || 'Zapkirana User',
                    role: payload.app_metadata?.role || 'CUSTOMER',
                    isVerified: true,
                }
            });
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            storeId: user.storeId,
            supabaseId: payload.sub
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map