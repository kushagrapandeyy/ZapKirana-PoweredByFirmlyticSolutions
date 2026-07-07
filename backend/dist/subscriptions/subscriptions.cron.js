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
const subscriptions_service_1 = require("./subscriptions.service");
let SubscriptionsCron = SubscriptionsCron_1 = class SubscriptionsCron {
    subscriptionsService;
    logger = new common_1.Logger(SubscriptionsCron_1.name);
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    async processDueSubscriptions() {
        this.logger.log('Starting daily subscription processing cron job...');
        try {
            const results = await this.subscriptionsService.processActiveSubscriptions();
            this.logger.log(`Daily subscription processing completed successfully. Processed ${results.length} bundle(s).`);
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
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsCron);
//# sourceMappingURL=subscriptions.cron.js.map