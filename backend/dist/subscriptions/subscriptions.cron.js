"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SubscriptionsCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma.service");
let SubscriptionsCron = SubscriptionsCron_1 = class SubscriptionsCron {
    prisma;
    logger = new common_1.Logger(SubscriptionsCron_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processDueSubscriptions() {
        this.logger.log('Starting daily subscription processing cron job...');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        try {
            const dueSubscriptions = await this.prisma.subscription.findMany({
                where: {
                    status: 'ACTIVE',
                    nextDeliveryDate: {
                        lte: today,
                    },
                },
                include: {
                    items: true,
                },
            });
            this.logger.log(`Found ${dueSubscriptions.length} due subscription(s).`);
            for (const sub of dueSubscriptions) {
                const order = await this.prisma.order.create({
                    data: {
                        customerId: sub.customerId,
                        storeId: sub.storeId,
                        status: 'PICKING',
                        totalAmount: sub.discountApplied ? -sub.discountApplied : 0,
                        deliveryAddress: 'Subscription Address',
                        items: {
                            create: sub.items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                priceAtOrder: 0,
                            }))
                        },
                        subscriptionId: sub.id,
                    },
                });
                this.logger.log(`Auto-queued Order ${order.id} for Subscription ${sub.id}`);
                let nextDate = new Date(sub.nextDeliveryDate || today);
                if (sub.frequency === 'DAILY') {
                    nextDate.setDate(nextDate.getDate() + 1);
                }
                else if (sub.frequency === 'WEEKLY') {
                    nextDate.setDate(nextDate.getDate() + 7);
                }
                else if (sub.frequency === 'MONTHLY') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                await this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { nextDeliveryDate: nextDate },
                });
            }
            this.logger.log('Daily subscription processing completed successfully.');
        }
        catch (error) {
            this.logger.error('Error processing subscriptions in cron', error);
        }
    }
};
exports.SubscriptionsCron = SubscriptionsCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsCron.prototype, "processDueSubscriptions", null);
exports.SubscriptionsCron = SubscriptionsCron = SubscriptionsCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsCron);
//# sourceMappingURL=subscriptions.cron.js.map