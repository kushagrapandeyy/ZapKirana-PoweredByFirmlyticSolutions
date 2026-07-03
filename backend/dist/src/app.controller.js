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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma.service");
const public_decorator_1 = require("./common/decorators/public.decorator");
let AppController = class AppController {
    appService;
    prisma;
    constructor(appService, prisma) {
        this.appService = appService;
        this.prisma = prisma;
    }
    getHello() {
        return this.appService.getHello();
    }
    async getStore(id) {
        const store = await this.prisma.store.findUnique({ where: { id } });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        return store;
    }
    async getNearbyStores(lat, lng, radiusKm) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const radius = radiusKm ? parseFloat(radiusKm) : 3.0;
        if (isNaN(userLat) || isNaN(userLng)) {
            return { error: 'Valid lat and lng query parameters required' };
        }
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
        });
        const nearbyStores = stores
            .map(store => {
            const distance = this.haversine(userLat, userLng, store.latitude, store.longitude);
            return { ...store, distanceKm: Math.round(distance * 10) / 10 };
        })
            .filter(store => store.distanceKm <= radius)
            .sort((a, b) => a.distanceKm - b.distanceKm);
        return nearbyStores;
    }
    haversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
exports.AppController = AppController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getStore", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores/nearby/search'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radiusKm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getNearbyStores", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService, prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map