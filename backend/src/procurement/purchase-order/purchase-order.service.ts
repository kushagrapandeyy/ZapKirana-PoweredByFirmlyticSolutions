import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { POStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  async createPO(storeId: string, supplierId: string, expectedDeliveryDate: Date, items: { productId: string, quantity: number, purchasePrice: number }[], notes?: string) {
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.quantity * item.purchasePrice);
    }

    // Generate a share token for external access
    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const po = await this.prisma.purchaseOrder.create({
      data: {
        storeId,
        supplierId,
        expectedDeliveryDate,
        totalAmount,
        notes,
        status: POStatus.CREATED,
        shareToken,
        shareTokenExpiresAt,
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            purchasePrice: i.purchasePrice,
          }))
        }
      },
      include: { items: { include: { product: true } }, supplier: true, store: true }
    });

    this.eventEmitter.emit('purchase_order.created', po);

    return po;
  }

  async getPOs(storeId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { storeId },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPOById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, store: true, items: { include: { product: true } } }
    });
    if (!po) throw new NotFoundException('PO not found');
    return po;
  }

  // Access PO via share token (no auth needed — for suppliers)
  async getPOByShareToken(token: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { shareToken: token },
      include: { supplier: true, store: true, items: { include: { product: true } } }
    });

    if (!po) throw new NotFoundException('PO not found or link is invalid');
    if (po.shareTokenExpiresAt && po.shareTokenExpiresAt < new Date()) {
      throw new BadRequestException('This share link has expired');
    }

    return po;
  }

  // Generate PDF HTML for a PO
  async generatePOPdfHtml(id: string) {
    const po = await this.getPOById(id);

    let itemRows = '';
    po.items.forEach((item: any, idx: number) => {
      itemRows += `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.product.name}</td>
          <td>${item.product.internalSku}</td>
          <td>${item.quantity}</td>
          <td>₹${item.purchasePrice.toFixed(2)}</td>
          <td>₹${(item.quantity * item.purchasePrice).toFixed(2)}</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 800; color: #6366f1; }
          .logo-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .po-badge { background: #eff6ff; border: 1px solid #6366f1; border-radius: 8px; padding: 12px 20px; text-align: right; }
          .po-badge h2 { font-size: 20px; color: #6366f1; margin-bottom: 4px; }
          .po-badge span { font-size: 12px; color: #64748b; }
          .info-grid { display: flex; gap: 40px; margin-bottom: 30px; }
          .info-block { flex: 1; }
          .info-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 10px; }
          .info-block p { font-size: 14px; color: #334155; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .total-row { text-align: right; font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 40px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          .notes { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px; border-radius: 4px; }
          .notes h4 { font-size: 12px; color: #92400e; margin-bottom: 5px; }
          .notes p { font-size: 13px; color: #78350f; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Basko</div>
            <div class="logo-sub">Purchase Order Document</div>
          </div>
          <div class="po-badge">
            <h2>PO #${po.id.substring(0, 8).toUpperCase()}</h2>
            <span>Status: ${po.status} | Date: ${new Date(po.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-block">
            <h3>From (Store)</h3>
            <p><strong>${po.store.name}</strong><br>${po.store.location || 'N/A'}<br>GSTIN: ${po.store.gstin || 'N/A'}</p>
          </div>
          <div class="info-block">
            <h3>To (Supplier)</h3>
            <p><strong>${po.supplier.name}</strong><br>${po.supplier.contactEmail || 'N/A'}<br>${po.supplier.contactPhone || 'N/A'}</p>
          </div>
          <div class="info-block">
            <h3>Delivery Details</h3>
            <p>Expected: <strong>${po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN') : 'TBD'}</strong></p>
          </div>
        </div>

        ${po.notes ? `<div class="notes"><h4>Notes</h4><p>${po.notes}</p></div>` : ''}

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="total-row">
          Grand Total: ₹${po.totalAmount.toFixed(2)}
        </div>

        <div class="footer">
          This is a system-generated purchase order from Basko – Powered by Firmlytic Solutions.<br>
          Generated on ${new Date().toLocaleString('en-IN')} | Document ID: ${po.id}
        </div>
      </body>
      </html>
    `;
  }

  async acceptPO(id: string) {
    const po = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: POStatus.ACCEPTED },
      include: { items: true }
    });
    this.eventEmitter.emit('purchase_order.accepted', po);
    return po;
  }

  async sendPO(id: string) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: POStatus.SENT },
    });
  }
}
