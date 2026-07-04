import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async createAddress(data: any) {
    // If this is set to default, unset other defaults
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

  async getUserAddresses(userId: string) {
    return this.prisma.savedAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAddress(id: string, data: any) {
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

  async deleteAddress(id: string) {
    return this.prisma.savedAddress.delete({ where: { id } });
  }
}
