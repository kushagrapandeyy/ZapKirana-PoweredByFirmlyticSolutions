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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventBusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const bullmq_1 = require("bullmq");
const bullmq_2 = require("@nestjs/bullmq");
let EventBusService = EventBusService_1 = class EventBusService {
    eventEmitter;
    eventQueue;
    logger = new common_1.Logger(EventBusService_1.name);
    constructor(eventEmitter, eventQueue) {
        this.eventEmitter = eventEmitter;
        this.eventQueue = eventQueue;
    }
    async publish(eventName, payload) {
        this.logger.debug(`[Event Bus] Publishing Event: ${eventName} for Store: ${payload.storeId}`);
        this.eventEmitter.emit(eventName, payload);
        try {
            await this.eventQueue.add(eventName, payload, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: true,
            });
        }
        catch (e) {
            this.logger.error(`Failed to push event to BullMQ: ${e.message}`);
        }
    }
};
exports.EventBusService = EventBusService;
exports.EventBusService = EventBusService = EventBusService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_2.InjectQueue)('basko-events')),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        bullmq_1.Queue])
], EventBusService);
//# sourceMappingURL=event-bus.service.js.map