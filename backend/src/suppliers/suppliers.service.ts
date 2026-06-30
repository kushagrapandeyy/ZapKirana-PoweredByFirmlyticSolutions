import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async getAllSuppliers() {
    return this.prisma.supplier.findMany();
  }

  async getStoreConnections(storeId: string) {
    return this.prisma.storeSupplierConnection.findMany({
      where: { storeId },
      include: { supplier: true },
    });
  }

  async connectStoreToSupplier(storeId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

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
}
