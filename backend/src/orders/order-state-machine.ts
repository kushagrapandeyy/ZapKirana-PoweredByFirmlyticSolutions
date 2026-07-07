import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export class OrderStateMachine {
  private static readonly transitionGraph: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PICKING, OrderStatus.CANCELLED],
    [OrderStatus.PICKING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
    [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  /**
   * Validates if the order can transition from current to target status.
   * Throws if invalid.
   */
  static assertValidTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
    const validNextStates = this.transitionGraph[currentStatus];

    if (!validNextStates) {
      throw new BadRequestException(`No transitions defined for state: ${currentStatus}`);
    }

    if (!validNextStates.includes(nextStatus)) {
      throw new BadRequestException(`Invalid state transition from ${currentStatus} to ${nextStatus}`);
    }
  }

  /**
   * Returns true if transition is valid, false otherwise.
   */
  static isValidTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
    const validNextStates = this.transitionGraph[currentStatus];
    return validNextStates ? validNextStates.includes(nextStatus) : false;
  }
}
