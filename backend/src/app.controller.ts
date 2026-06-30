import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('stores/:id')
  async getStore(@Param('id') id: string) {
    return this.prisma.store.findUnique({ where: { id } });
  }

  // Nearby stores endpoint using Haversine formula
  @Get('stores/nearby/search')
  async getNearbyStores(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
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
        const distance = this.haversine(userLat, userLng, store.latitude!, store.longitude!);
        return { ...store, distanceKm: Math.round(distance * 10) / 10 };
      })
      .filter(store => store.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearbyStores;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
