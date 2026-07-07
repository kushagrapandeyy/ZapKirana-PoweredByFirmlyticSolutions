const fs = require('fs');
const path = 'backend/src/realtime/realtime.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Add OnEvent and Prisma imports
if (!content.includes("import { OnEvent }")) {
  content = content.replace(
    "import { Injectable, Logger } from '@nestjs/common';",
    "import { Injectable, Logger } from '@nestjs/common';\nimport { OnEvent } from '@nestjs/event-emitter';\nimport { PrismaService } from '../prisma.service';"
  );
}

// Inject PrismaService
content = content.replace(
  "  constructor() {",
  "  constructor(private prisma: PrismaService) {"
);

// Add listener
const listener = `
  @OnEvent('order.status_changed')
  async handleOrderStatusChanged(event: { orderId: string; status: string; customerId: string }) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: event.orderId },
        include: { items: { include: { product: true } } }
      });
      if (order) {
        await this.broadcastOrderUpdate(order.storeId, event.orderId, order);
      }
    } catch (e) {
      this.logger.error('Failed to fetch order for broadcast', e);
    }
  }
`;

content += listener;
fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting realtime.service.ts');
