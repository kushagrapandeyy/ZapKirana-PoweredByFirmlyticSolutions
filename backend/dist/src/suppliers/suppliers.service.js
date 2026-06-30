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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SuppliersService = class SuppliersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllSuppliers() {
        return this.prisma.supplier.findMany();
    }
    async getStoreConnections(storeId) {
        return this.prisma.storeSupplierConnection.findMany({
            where: { storeId },
            include: { supplier: true },
        });
    }
    async connectStoreToSupplier(storeId, supplierId) {
        const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        const existing = await this.prisma.storeSupplierConnection.findUnique({
            where: { storeId_supplierId: { storeId, supplierId } },
        });
        if (existing) {
            return existing;
        }
        return this.prisma.storeSupplierConnection.create({
            data: {
                storeId,
                supplierId,
                status: 'PENDING',
            },
        });
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map