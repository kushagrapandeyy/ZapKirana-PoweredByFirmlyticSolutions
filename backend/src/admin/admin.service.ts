import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async logAudit(action: string, entityType: string, entityId?: string, userId?: string, details?: string) {
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

  // ─── STORES ────────────────────────────────────────

  async getStores() {
    return this.prisma.store.findMany({
      include: { _count: { select: { products: true, orders: true, users: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createStore(data: any, adminId: string) {
    if (!data.name || (!data.address && !data.location)) {
      throw new BadRequestException('Store name and address/location are required');
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

  async updateStore(id: string, data: any, adminId: string) {
    const store = await this.prisma.store.update({
      where: { id },
      data: {
        name: data.name,
        location: data.address || data.location,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
        operatingRadiusKm: data.operatingRadiusKm ? parseFloat(data.operatingRadiusKm) : undefined,
        bankAccountNumber: data.bankAccountNumber,
        bankRoutingNumber: data.bankRoutingNumber,
        taxId: data.taxId,
        gstin: data.taxId,
        imageUrl: data.imageUrl,
        operatingHours: data.operatingHours ? JSON.stringify(data.operatingHours) : undefined,
        description: data.description,
      }
    });

    await this.logAudit('STORE_UPDATED', 'STORE', store.id, adminId, `Updated store ${store.name}`);
    return store;
  }

  async archiveStore(id: string, adminId: string) {
    const store = await this.prisma.store.update({
      where: { id },
      data: { isActive: false }
    });
    await this.logAudit('STORE_ARCHIVED', 'STORE', store.id, adminId, `Archived store ${store.name}`);
    return { success: true };
  }

  async bulkCreateStores(storesData: any[], adminId: string) {
    const creates = storesData.map(data => ({
      name: data.name,
      location: data.address || data.location,
      latitude: data.latitude ? parseFloat(data.latitude) : 0,
      longitude: data.longitude ? parseFloat(data.longitude) : 0,
      operatingRadiusKm: data.operatingRadiusKm ? parseFloat(data.operatingRadiusKm) : 3,
      bankAccountNumber: data.bankAccountNumber || null,
      bankRoutingNumber: data.bankRoutingNumber || null,
      taxId: data.taxId || null,
      gstin: data.taxId || null,
      imageUrl: data.imageUrl || null,
      description: data.description || null,
    }));

    const result = await this.prisma.store.createMany({
      data: creates,
      skipDuplicates: true,
    });

    await this.logAudit('STORE_BULK_CREATED', 'STORE', 'bulk', adminId, `Bulk created ${result.count} stores`);
    return { count: result.count };
  }

  // ─── VENDORS ───────────────────────────────────────

  async getVendors() {
    return this.prisma.user.findMany({
      where: { role: { in: ['STAFF', 'MANAGER', 'OWNER', 'DELIVERY'] } },
      include: { store: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createVendor(data: any, adminId: string) {
    if (!data.name || !data.email || !data.phone || !data.password || !data.storeId) {
      throw new BadRequestException('All vendor fields are required');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('User with email already exists');
    }

    const store = await this.prisma.store.findUnique({ where: { id: data.storeId } });
    if (!store) {
      throw new NotFoundException('Assigned store not found');
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

  // ─── SUPPLIERS ─────────────────────────────────────

  async getSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        _count: { select: { storeConnections: true, purchaseOrders: true, supplierProducts: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSupplierById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        storeConnections: { include: { store: true } },
        purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10, include: { store: true } },
        supplierProducts: { include: { product: true } },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async createSupplier(data: any, adminId: string) {
    if (!data.name) {
      throw new BadRequestException('Supplier name is required');
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

  async updateSupplier(id: string, data: any, adminId: string) {
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

  // ─── AUDITS ────────────────────────────────────────

  async getAudits(limit?: number) {
    return this.prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limit || 100
    });
  }

  // ─── DASHBOARD ─────────────────────────────────────

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

  // ─── HR & STAFF MANAGEMENT ──────────────────────────

  async getStaffList(storeId: string) {
    const staffList = await this.prisma.user.findMany({
      where: { role: { in: ['STAFF', 'MANAGER', 'OWNER'] }, storeId },
    });

    return staffList;
  }

  // ─── ALERTS ────────────────────────────────────────

  async getAlerts(storeId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [lowStock, expiringSoon, damagedGoods] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { storeId, onHandQty: { lte: 10 } }, // naive threshold
        include: { product: true }
      }),
      this.prisma.inventory.findMany({
        where: { storeId, expiryDate: { not: null, lte: sevenDaysFromNow }, onHandQty: { gt: 0 } },
        include: { product: true }
      }),
      this.prisma.stockMovement.findMany({
        where: { 
          inventory: { storeId }, 
          type: 'DAMAGED', // Adjusted to DAMAGED
          createdAt: { gte: thirtyDaysAgo }
        },
        include: { inventory: { include: { product: true } } } // removed user:true
      })
    ]);

    return { lowStock, expiringSoon, damagedGoods };
  }
}
