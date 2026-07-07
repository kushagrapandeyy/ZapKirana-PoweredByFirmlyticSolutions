import { OrderStatus } from '@prisma/client';
export declare class OrderStateMachine {
    private static readonly transitionGraph;
    static assertValidTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void;
    static isValidTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean;
}
