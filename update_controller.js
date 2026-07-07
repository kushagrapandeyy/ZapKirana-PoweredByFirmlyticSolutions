const fs = require('fs');
const path = 'backend/src/inventory/inventory.controller.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("@Patch('products/:id')")) {
  const patchMethod = `
  @Patch('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: { storeId: string; name?: string; category?: string; price?: number; imageUrl?: string; supplierId?: string }
  ) {
    return this.inventoryService.updateProduct(id, body.storeId, body);
  }
`;
  content = content.replace("export class InventoryController {", "export class InventoryController {" + patchMethod);
  
  if (!content.includes("Patch")) {
    content = content.replace(/import \{ Controller, Post, Body, Get, Param, Query, BadRequestException \} from '@nestjs\/common';/, "import { Controller, Post, Body, Get, Param, Query, BadRequestException, Patch } from '@nestjs/common';");
  }
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Added PATCH products/:id to InventoryController');
} else {
  console.log('PATCH products/:id already exists');
}
