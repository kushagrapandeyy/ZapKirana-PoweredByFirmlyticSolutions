const fs = require('fs');
const path = 'backend/src/inventory/inventory.service.ts';
let content = fs.readFileSync(path, 'utf8');

const updateMethod = `
  async updateProduct(id: string, storeId: string, data: { name?: string, category?: string, price?: number, imageUrl?: string, supplierId?: string }) {
    const { supplierId, ...updateData } = data;
    
    // Update product base
    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    // If supplierId is provided, upsert the supplier linkage
    if (supplierId) {
      const existingLink = await this.prisma.supplierProduct.findFirst({
        where: { productId: id, supplierId }
      });
      if (!existingLink) {
        await this.prisma.supplierProduct.create({
          data: {
            productId: id,
            supplierId,
            price: updateData.price || product.price,
          }
        });
      }
    }

    return product;
  }
`;

content = content.replace("export class InventoryService {\n  constructor(private prisma: PrismaService) {}", "export class InventoryService {\n  constructor(private prisma: PrismaService) {}\n" + updateMethod);

fs.writeFileSync(path, content, 'utf8');
console.log('Added updateProduct to InventoryService');
