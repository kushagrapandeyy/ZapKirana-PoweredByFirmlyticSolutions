import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(data: {
    storeId: string;
    barcode?: string;
    internalSku: string;
    name: string;
    description?: string;
    category?: string;
    mrp: number;
    sellingPrice: number;
    purchaseCost?: number;
    gstRate?: number;
    imageUrl?: string;
  }) {
    return this.prisma.product.create({
      data,
    });
  }

  async findAll(storeId: string) {
    return this.prisma.product.findMany({
      where: { storeId, isActive: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findByBarcode(storeId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { storeId, barcode, isActive: true },
    });
    if (!product) throw new NotFoundException(`Barcode ${barcode} not found`);
    return product;
  }

  async updatePrice(id: string, mrp: number, sellingPrice: number) {
    return this.prisma.product.update({
      where: { id },
      data: { mrp, sellingPrice },
    });
  }
}
