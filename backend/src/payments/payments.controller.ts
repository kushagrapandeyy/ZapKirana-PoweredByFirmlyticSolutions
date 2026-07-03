import {
  Controller, Post, Get, Body, Param, Headers, RawBodyRequest,
  UseGuards, Req, HttpCode,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import * as express from 'express';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/v1/payments/pos/create-qr
   * Create Razorpay UPI QR for a POS bill.
   * Requires auth.
   */
  @UseGuards(JwtAuthGuard)
  @Post('pos/create-qr')
  createPosQr(
    @Body() body: { storeId: string; billId: string; amountPaise: number },
  ) {
    return this.paymentsService.createPosQr(body.storeId, body.billId, body.amountPaise);
  }

  /**
   * POST /api/v1/payments/orders/create
   * Create Razorpay Order for consumer checkout.
   * Requires auth.
   */
  @UseGuards(JwtAuthGuard)
  @Post('orders/create')
  createOrderPayment(
    @Body() body: { storeId: string; orderId: string; amountPaise: number },
  ) {
    return this.paymentsService.createOrderPayment(body.storeId, body.orderId, body.amountPaise);
  }

  /**
   * POST /api/v1/payments/pos/cash
   * Record a cash payment for a POS bill.
   * Requires auth.
   */
  @UseGuards(JwtAuthGuard)
  @Post('pos/cash')
  recordCash(
    @Body() body: {
      storeId: string;
      billId: string;
      amountReceived: number;
      changeReturned: number;
    },
  ) {
    return this.paymentsService.recordCashPayment(
      body.storeId,
      body.billId,
      body.amountReceived,
      body.changeReturned,
    );
  }

  /**
   * GET /api/v1/payments/:paymentId
   * Get payment status + recent events.
   * Requires auth.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':paymentId')
  getStatus(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  /**
   * POST /api/v1/payments/razorpay/webhook
   * Razorpay webhook endpoint — NO auth guard (Razorpay can't send JWT).
   * Signature verification is done inside the service using HMAC-SHA256.
   *
   * IMPORTANT: NestJS must be configured with rawBody: true in main.ts
   * for signature verification to work correctly.
   */
  @Public()
  @Post('razorpay/webhook')
  @HttpCode(200)
  handleWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = (req.rawBody as Buffer | undefined)?.toString('utf8') ?? JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(rawBody, signature ?? '');
  }
}
