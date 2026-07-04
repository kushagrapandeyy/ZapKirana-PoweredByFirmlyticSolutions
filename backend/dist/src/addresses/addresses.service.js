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
exports.AddressesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AddressesService = class AddressesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAddress(data) {
        if (data.isDefault) {
            await this.prisma.savedAddress.updateMany({
                where: { userId: data.userId },
                data: { isDefault: false },
            });
        }
        return this.prisma.savedAddress.create({
            data: {
                userId: data.userId,
                label: data.label,
                streetAddress: data.streetAddress,
                landmark: data.landmark,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
                isDefault: data.isDefault || false,
            },
        });
    }
    async getUserAddresses(userId) {
        return this.prisma.savedAddress.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateAddress(id, data) {
        if (data.isDefault) {
            const address = await this.prisma.savedAddress.findUnique({ where: { id } });
            if (address) {
                await this.prisma.savedAddress.updateMany({
                    where: { userId: address.userId },
                    data: { isDefault: false },
                });
            }
        }
        return this.prisma.savedAddress.update({
            where: { id },
            data,
        });
    }
    async deleteAddress(id) {
        return this.prisma.savedAddress.delete({ where: { id } });
    }
};
exports.AddressesService = AddressesService;
exports.AddressesService = AddressesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressesService);
//# sourceMappingURL=addresses.service.js.map