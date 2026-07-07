"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStateMachine = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
class OrderStateMachine {
    static transitionGraph = {
        [client_1.OrderStatus.PAYMENT_PENDING]: [client_1.OrderStatus.PAID, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.PAID]: [client_1.OrderStatus.PICKING, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.PICKING]: [client_1.OrderStatus.READY_FOR_PICKUP, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.READY_FOR_PICKUP]: [client_1.OrderStatus.OUT_FOR_DELIVERY, client_1.OrderStatus.DELIVERED, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.OUT_FOR_DELIVERY]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.DELIVERED]: [],
        [client_1.OrderStatus.CANCELLED]: [],
    };
    static assertValidTransition(currentStatus, nextStatus) {
        const validNextStates = this.transitionGraph[currentStatus];
        if (!validNextStates) {
            throw new common_1.BadRequestException(`No transitions defined for state: ${currentStatus}`);
        }
        if (!validNextStates.includes(nextStatus)) {
            throw new common_1.BadRequestException(`Invalid state transition from ${currentStatus} to ${nextStatus}`);
        }
    }
    static isValidTransition(currentStatus, nextStatus) {
        const validNextStates = this.transitionGraph[currentStatus];
        return validNextStates ? validNextStates.includes(nextStatus) : false;
    }
}
exports.OrderStateMachine = OrderStateMachine;
//# sourceMappingURL=order-state-machine.js.map