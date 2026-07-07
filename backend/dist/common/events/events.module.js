"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const event_bus_service_1 = require("./event-bus.service");
const queueDriver = process.env.QUEUE_DRIVER || 'memory';
const imports = [];
const providers = [event_bus_service_1.EventBusService];
if (queueDriver === 'redis') {
    imports.push(bullmq_1.BullModule.registerQueue({ name: 'basko-events' }));
}
else {
    providers.push({
        provide: (0, bullmq_1.getQueueToken)('basko-events'),
        useValue: {
            add: async (name) => {
                console.log(`[Memory Queue] Job ${name} executed in memory (Redis disabled).`);
            }
        }
    });
}
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports,
        providers,
        exports: [event_bus_service_1.EventBusService],
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map