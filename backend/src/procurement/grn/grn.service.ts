import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { POStatus } from '@prisma/client';

@Injectable()
export class GrnService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  async receiveGoods(poId: string, receivedItems: { poItemId: string, receivedQuantity: number }[], staffId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true }
    });

    if (!po) throw new NotFoundException('PO not found');
    if (po.status !== POStatus.ACCEPTED && po.status !== POStatus.PARTIALLY_ACCEPTED) {
      throw new BadRequestException(`Cannot receive goods for PO with status ${po.status}`);
    }

    // Process each item
    for (const item of receivedItems) {
      const poItem = po.items.find((i: any) => i.id === item.poItemId);
      if (!poItem) throw new BadRequestException(`Item ${item.poItemId} not in PO`);

      await this.prisma.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQuantity: item.receivedQuantity }
      });
    }

    // Update PO status
    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: POStatus.DELIVERED },
      include: { items: true }
    });

    // Emit event for inventory to process
    this.eventEmitter.emit('purchase_order.grn_completed', { po: updatedPo, staffId });

    return updatedPo;
  }
}
