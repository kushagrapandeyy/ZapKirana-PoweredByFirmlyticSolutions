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
exports.PurchaseOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let PurchaseOrderService = class PurchaseOrderService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async createPO(storeId, supplierId, expectedDeliveryDate, items, notes) {
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += (item.quantity * item.purchasePrice);
        }
        const shareToken = crypto.randomBytes(32).toString('hex');
        const shareTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const po = await this.prisma.purchaseOrder.create({
            data: {
                storeId,
                supplierId,
                expectedDeliveryDate,
                totalAmount,
                notes,
                status: client_1.POStatus.CREATED,
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
    async getPOs(storeId) {
        return this.prisma.purchaseOrder.findMany({
            where: { storeId },
            include: { supplier: true, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getPOById(id) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { supplier: true, store: true, items: { include: { product: true } } }
        });
        if (!po)
            throw new common_1.NotFoundException('PO not found');
        return po;
    }
    async updatePOItems(id, items) {
        const po = await this.getPOById(id);
        if (po.status !== client_1.POStatus.CREATED) {
            throw new common_1.BadRequestException('Can only update POs in CREATED state');
        }
        await this.prisma.purchaseOrderItem.deleteMany({
            where: { poId: id }
        });
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += (item.quantity * item.purchasePrice);
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                totalAmount,
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
    }
    async deletePO(id) {
        const po = await this.getPOById(id);
        if (po.status !== client_1.POStatus.CREATED) {
            throw new common_1.BadRequestException('Can only delete POs in CREATED state');
        }
        await this.prisma.purchaseOrderItem.deleteMany({
            where: { poId: id }
        });
        return this.prisma.purchaseOrder.delete({
            where: { id }
        });
    }
    async getPOByShareToken(token) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { shareToken: token },
            include: { supplier: true, store: true, items: { include: { product: true } } }
        });
        if (!po)
            throw new common_1.NotFoundException('PO not found or link is invalid');
        if (po.shareTokenExpiresAt && po.shareTokenExpiresAt < new Date()) {
            throw new common_1.BadRequestException('This share link has expired');
        }
        return po;
    }
    async generatePOPdfHtml(id) {
        const po = await this.getPOById(id);
        let itemRows = '';
        let totalTaxable = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let grandTotal = 0;
        po.items.forEach((item, idx) => {
            const qty = item.quantity;
            const price = item.purchasePrice;
            const amount = qty * price;
            const taxRate = 0.18;
            const cgst = amount * 0.09;
            const sgst = amount * 0.09;
            const itemTotal = amount + cgst + sgst;
            totalTaxable += amount;
            totalCGST += cgst;
            totalSGST += sgst;
            grandTotal += itemTotal;
            itemRows += `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.product.name}</td>
          <td>${item.product.internalSku || 'N/A'}</td>
          <td>1234</td> <!-- Dummy HSN -->
          <td>${qty}</td>
          <td>₹${price.toFixed(2)}</td>
          <td>₹${amount.toFixed(2)}</td>
          <td>9%<br>₹${cgst.toFixed(2)}</td>
          <td>9%<br>₹${sgst.toFixed(2)}</td>
          <td>₹${itemTotal.toFixed(2)}</td>
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
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .header h1 { font-size: 24px; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; }
          .header p { font-size: 13px; color: #64748b; margin-top: 5px; }
          
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
          .address-block { flex: 1; }
          .address-block h3 { font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
          .address-block p { font-size: 13px; color: #334155; line-height: 1.6; }
          .address-block strong { color: #0f172a; }
          
          .meta-info { flex: 1; text-align: right; }
          .meta-info p { font-size: 13px; color: #334155; margin-bottom: 5px; }
          .meta-info strong { color: #0f172a; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; }
          th { background: #f8fafc; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border: 1px solid #e2e8f0; }
          td { padding: 12px 10px; font-size: 12px; border: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
          
          .totals { width: 50%; float: right; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 40px; }
          .totals-row { display: flex; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .totals-row:last-child { border-bottom: none; background: #f8fafc; font-weight: bold; font-size: 15px; color: #0f172a; }
          
          .clear { clear: both; }
          .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tax Invoice</h1>
          <p>Original for Recipient</p>
        </div>

        <div class="invoice-details">
          <div class="address-block" style="padding-right: 20px; border-right: 1px solid #e2e8f0;">
            <h3>Billed To (Buyer)</h3>
            <p>
              <strong>${po.store.name}</strong><br>
              ${po.store.location || 'N/A'}<br>
              <strong>GSTIN:</strong> ${po.store.gstin || 'N/A'}
            </p>
          </div>
          <div class="address-block" style="padding-left: 20px;">
            <h3>Billed From (Supplier)</h3>
            <p>
              <strong>${po.supplier.name}</strong><br>
              ${po.supplier.station || po.supplier.address || 'N/A'}<br>
              <strong>GSTIN:</strong> ${po.supplier.gstin || 'N/A'}<br>
              <strong>Phone:</strong> ${po.supplier.phone || 'N/A'}
            </p>
          </div>
        </div>

        <div style="margin-bottom: 20px; font-size: 13px; color: #334155;">
          <strong>PO No:</strong> ${po.id.substring(0, 8).toUpperCase()}<br>
          <strong>PO Date:</strong> ${new Date(po.createdAt).toLocaleDateString('en-IN')}<br>
          <strong>Invoice Date:</strong> ${new Date().toLocaleDateString('en-IN')}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description of Goods</th>
              <th>SKU</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Taxable Val</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Total Taxable Value</span>
            <span>₹${totalTaxable.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Total CGST</span>
            <span>₹${totalCGST.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Total SGST</span>
            <span>₹${totalSGST.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Grand Total</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="clear"></div>
        ${po.notes ? `<div style="margin-bottom: 30px; font-size: 13px;"><strong>Notes:</strong> ${po.notes}</div>` : ''}

        <div class="footer">
          This is a computer-generated tax invoice and requires no physical signature.<br>
          Zapkirana – Powered by Firmlytic Solutions.
        </div>
      </body>
      </html>
    `;
    }
    async acceptPO(id) {
        const po = await this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: client_1.POStatus.ACCEPTED },
            include: { items: true }
        });
        this.eventEmitter.emit('purchase_order.accepted', po);
        return po;
    }
    async approvePO(id) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!po)
            throw new common_1.NotFoundException('PO not found');
        const updatedPo = await this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: client_1.POStatus.ACCEPTED },
            include: { items: true }
        });
        this.eventEmitter.emit('purchase_order.approved', updatedPo);
        return updatedPo;
    }
    async sendPO(id) {
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: client_1.POStatus.SENT },
        });
    }
};
exports.PurchaseOrderService = PurchaseOrderService;
exports.PurchaseOrderService = PurchaseOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], PurchaseOrderService);
//# sourceMappingURL=purchase-order.service.js.map