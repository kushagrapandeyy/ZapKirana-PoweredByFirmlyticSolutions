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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logAudit(action, entityType, entityId, userId, details) {
        return this.prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                userId,
                details,
            }
        });
    }
    async getStores() {
        return this.prisma.store.findMany({
            include: { _count: { select: { products: true, orders: true, users: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createStore(data, adminId) {
        if (!data.name || !data.address) {
            throw new common_1.BadRequestException('Store name and address are required');
        }
        const store = await this.prisma.store.create({
            data: {
                name: data.name,
                location: data.address || data.location,
                latitude: parseFloat(data.latitude) || 0,
                longitude: parseFloat(data.longitude) || 0,
                operatingRadiusKm: parseFloat(data.operatingRadiusKm) || 3,
                bankAccountNumber: data.bankAccountNumber || null,
                bankRoutingNumber: data.bankRoutingNumber || null,
                taxId: data.taxId || null,
                gstin: data.taxId || null,
                imageUrl: data.imageUrl || null,
                operatingHours: data.operatingHours || null,
                description: data.description || null,
            }
        });
        await this.logAudit('STORE_CREATED', 'STORE', store.id, adminId, `Created store ${store.name}`);
        return store;
    }
    async getVendors() {
        return this.prisma.user.findMany({
            where: { role: { in: ['STAFF', 'MANAGER', 'OWNER', 'DELIVERY'] } },
            include: { store: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createVendor(data, adminId) {
        if (!data.name || !data.email || !data.phone || !data.password || !data.storeId) {
            throw new common_1.BadRequestException('All vendor fields are required');
        }
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new common_1.BadRequestException('User with email already exists');
        }
        const store = await this.prisma.store.findUnique({ where: { id: data.storeId } });
        if (!store) {
            throw new common_1.NotFoundException('Assigned store not found');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: data.role || 'STAFF',
                storeId: store.id
            }
        });
        await this.logAudit('VENDOR_CREATED', 'USER', user.id, adminId, `Created vendor ${user.name} (${data.role || 'STAFF'}) for store ${store.name}`);
        return user;
    }
    async getSuppliers() {
        return this.prisma.supplier.findMany({
            include: {
                _count: { select: { storeConnections: true, purchaseOrders: true, supplierProducts: true } },
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getSupplierById(id) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: {
                storeConnections: { include: { store: true } },
                purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10, include: { store: true } },
                supplierProducts: { include: { product: true } },
            },
        });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        return supplier;
    }
    async createSupplier(data, adminId) {
        if (!data.name) {
            throw new common_1.BadRequestException('Supplier name is required');
        }
        const supplier = await this.prisma.supplier.create({
            data: {
                name: data.name,
                contactEmail: data.contactEmail || null,
                contactPhone: data.contactPhone || null,
                address: data.address || null,
                categories: data.categories || null,
                description: data.description || null,
                paymentTerms: data.paymentTerms || null,
                logoUrl: data.logoUrl || null,
            },
        });
        await this.logAudit('SUPPLIER_CREATED', 'SUPPLIER', supplier.id, adminId, `Onboarded supplier ${supplier.name}`);
        return supplier;
    }
    async updateSupplier(id, data, adminId) {
        const supplier = await this.prisma.supplier.update({
            where: { id },
            data: {
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                address: data.address,
                categories: data.categories,
                description: data.description,
                paymentTerms: data.paymentTerms,
                logoUrl: data.logoUrl,
            },
        });
        await this.logAudit('SUPPLIER_UPDATED', 'SUPPLIER', supplier.id, adminId, `Updated supplier ${supplier.name}`);
        return supplier;
    }
    async getAudits(limit) {
        return this.prisma.auditLog.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
            take: limit || 100
        });
    }
    async getDashboardStats() {
        const [totalStores, totalVendors, totalSuppliers, totalOrders, totalSubscriptions, recentOrders] = await Promise.all([
            this.prisma.store.count({ where: { isActive: true } }),
            this.prisma.user.count({ where: { role: { in: ['STAFF', 'MANAGER', 'OWNER'] } } }),
            this.prisma.supplier.count({ where: { isActive: true } }),
            this.prisma.order.count(),
            this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            this.prisma.order.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { store: true, customer: true },
            }),
        ]);
        return {
            totalStores,
            totalVendors,
            totalSuppliers,
            totalOrders,
            totalSubscriptions,
            recentOrders,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map