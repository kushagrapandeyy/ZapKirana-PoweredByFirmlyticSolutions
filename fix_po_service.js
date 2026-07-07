const fs = require('fs');
const path = 'backend/src/procurement/purchase-order/purchase-order.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace generatePOPdfHtml
const pdfHtmlRegex = /async generatePOPdfHtml[\s\S]*?async acceptPO/m;

const newPdfHtml = `async generatePOPdfHtml(id: string) {
    const po = await this.getPOById(id);

    let itemRows = '';
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let grandTotal = 0;

    po.items.forEach((item: any, idx: number) => {
      const qty = item.quantity;
      const price = item.purchasePrice;
      const amount = qty * price;
      
      // Standard 18% GST (9% CGST, 9% SGST) for B2B invoice demo
      const taxRate = 0.18;
      const cgst = amount * 0.09;
      const sgst = amount * 0.09;
      const itemTotal = amount + cgst + sgst;

      totalTaxable += amount;
      totalCGST += cgst;
      totalSGST += sgst;
      grandTotal += itemTotal;

      itemRows += \`
        <tr>
          <td>\${idx + 1}</td>
          <td>\${item.product.name}</td>
          <td>\${item.product.internalSku || 'N/A'}</td>
          <td>1234</td> <!-- Dummy HSN -->
          <td>\${qty}</td>
          <td>₹\${price.toFixed(2)}</td>
          <td>₹\${amount.toFixed(2)}</td>
          <td>9%<br>₹\${cgst.toFixed(2)}</td>
          <td>9%<br>₹\${sgst.toFixed(2)}</td>
          <td>₹\${itemTotal.toFixed(2)}</td>
        </tr>
      \`;
    });

    return \`
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
              <strong>\${po.store.name}</strong><br>
              \${po.store.location || 'N/A'}<br>
              <strong>GSTIN:</strong> \${po.store.gstin || 'N/A'}<br>
              <strong>State:</strong> \${po.store.state || 'N/A'}
            </p>
          </div>
          <div class="address-block" style="padding-left: 20px;">
            <h3>Billed From (Supplier)</h3>
            <p>
              <strong>\${po.supplier.name}</strong><br>
              \${po.supplier.city || 'N/A'}<br>
              <strong>GSTIN:</strong> \${po.supplier.gstin || 'N/A'}<br>
              <strong>Phone:</strong> \${po.supplier.contactPhone || 'N/A'}
            </p>
          </div>
        </div>

        <div style="margin-bottom: 20px; font-size: 13px; color: #334155;">
          <strong>PO No:</strong> \${po.id.substring(0, 8).toUpperCase()}<br>
          <strong>PO Date:</strong> \${new Date(po.createdAt).toLocaleDateString('en-IN')}<br>
          <strong>Invoice Date:</strong> \${new Date().toLocaleDateString('en-IN')}
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
            \${itemRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Total Taxable Value</span>
            <span>₹\${totalTaxable.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Total CGST</span>
            <span>₹\${totalCGST.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Total SGST</span>
            <span>₹\${totalSGST.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Grand Total</span>
            <span>₹\${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="clear"></div>
        \${po.notes ? \`<div style="margin-bottom: 30px; font-size: 13px;"><strong>Notes:</strong> \${po.notes}</div>\` : ''}

        <div class="footer">
          This is a computer-generated tax invoice and requires no physical signature.<br>
          Zapkirana – Powered by Firmlytic Solutions.
        </div>
      </body>
      </html>
    \`;
  }

  async acceptPO`;

content = content.replace(pdfHtmlRegex, newPdfHtml);

// Add approvePO logic
const acceptPORegex = /async acceptPO\(id: string\) \{[\s\S]*?return po;\n  \}/m;
const acceptPOContent = content.match(acceptPORegex)[0];

const approvePOHtml = `${acceptPOContent}

  async approvePO(id: string) {
    // Approve the PO and inject into inventory as requested
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!po) throw new NotFoundException('PO not found');
    
    // Update PO status to APPROVED
    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: POStatus.APPROVED },
      include: { items: true }
    });

    // Automatically add items to inventory
    for (const item of po.items) {
      const inventory = await this.prisma.inventory.upsert({
        where: { storeId_productId: { storeId: po.storeId, productId: item.productId } },
        update: { stock: { increment: item.quantity } },
        create: {
          storeId: po.storeId,
          productId: item.productId,
          stock: item.quantity,
          price: item.purchasePrice // Defaulting retail to purchase for simplicity if not set
        }
      });

      // Log to StockLedger
      await this.prisma.stockLedger.create({
        data: {
          storeId: po.storeId,
          productId: item.productId,
          type: 'PURCHASE_ORDER_APPROVAL',
          quantityChange: item.quantity,
          notes: \`Auto-received upon PO #\${po.id.substring(0,8)} Approval. Supplier: \${po.supplierId}\`
        }
      });
    }

    this.eventEmitter.emit('purchase_order.approved', updatedPo);
    return updatedPo;
  }`;

content = content.replace(acceptPORegex, approvePOHtml);

fs.writeFileSync(path, content, 'utf8');
console.log('PO Service Updated successfully!');
