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
exports.StoreScopeGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
let StoreScopeGuard = class StoreScopeGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            return false;
        if (user.role === 'PLATFORM_ADMIN' || user.role === 'SUPPORT')
            return true;
        const storeId = request.query?.storeId ??
            request.body?.storeId ??
            request.params?.storeId;
        if (!storeId)
            return true;
        const accessibleStoreIds = user.storeIds ?? [];
        if (!accessibleStoreIds.includes(storeId)) {
            throw new common_1.ForbiddenException(`Store ${storeId} is not accessible to your account.`);
        }
        return true;
    }
};
exports.StoreScopeGuard = StoreScopeGuard;
exports.StoreScopeGuard = StoreScopeGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], StoreScopeGuard);
//# sourceMappingURL=store-scope.guard.js.map