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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let CampaignsService = class CampaignsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCampaign(storeId, data) {
        return this.prisma.$transaction(async (tx) => {
            const campaign = await tx.storeCampaign.create({
                data: {
                    storeId,
                    title: data.title,
                    description: data.description,
                    discountPercentage: data.discountPercentage,
                    animationType: data.animationType || 'DEFAULT',
                    endsAt: data.endsAt,
                },
            });
            for (const pId of data.productIds) {
                const product = await tx.product.findUnique({ where: { id: pId } });
                if (product && product.storeId === storeId) {
                    await tx.product.update({
                        where: { id: pId },
                        data: { campaignId: campaign.id },
                    });
                }
            }
            return campaign;
        });
    }
    async getActiveCampaigns(storeId) {
        return this.prisma.storeCampaign.findMany({
            where: {
                storeId,
                isActive: true,
            },
            include: {
                products: true,
            }
        });
    }
    async endCampaign(campaignId) {
        return this.prisma.$transaction(async (tx) => {
            const campaign = await tx.storeCampaign.update({
                where: { id: campaignId },
                data: { isActive: false, endsAt: new Date() },
            });
            await tx.product.updateMany({
                where: { campaignId },
                data: { campaignId: null },
            });
            return campaign;
        });
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map