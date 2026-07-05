import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID     ?? '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
const RAZORPAY_API_BASE   = 'https://api.razorpay.com/v1';

// ─── Razorpay HTTP helper ─────────────────────────────────────────────────────

async function razorpayRequest(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<any> {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new BadRequestException(
      `Razorpay API error: ${err?.error?.description ?? res.statusText}`,
    );
  }

  return res.json();
}

// ─── Webhook signature verification ──────────────────────────────────────────

function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a Razorpay QR code for a POS bill.
   * The QR is shown on screen; customer scans and pays via UPI.
   *
   * POST /api/v1/payments/pos/create-qr
   */
  async createPosQr(storeId: string, billId: string, amountPaise: number) {
    const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundException('POS bill not found');
    if (bill.status !== 'DRAFT') throw new BadRequestException('Bill is not in DRAFT state');

    // Create Razorpay QR code
    const qr = await razorpayRequest('POST', '/payments/qr_codes', {
      type: 'upi_qr',
      name: `Zapkirana Store Payment`,
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amountPaise, // in paise
      description: `POS Bill ${billId.substring(0, 8).toUpperCase()}`,
      close_by: Math.floor(Date.now() / 1000) + 300, // 5-minute QR
    });

    // Create internal Payment record
    const payment = await this.prisma.payment.create({
      data: {
        storeId,
        source: 'POS_BILL',
        billId,
        provider: 'RAZORPAY',
        providerQrId: qr.id,
        amount: amountPaise / 100,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    return {
      paymentId: payment.id,
      provider: 'RAZORPAY',
      qrCodeId: qr.id,
      qrImageUrl: qr.image_url,
      amount: amountPaise / 100,
      currency: 'INR',
      status: 'PENDING',
      expiresAt: new Date((qr.close_by ?? Math.floor(Date.now() / 1000) + 300) * 1000).toISOString(),
    };
  }

  /**
   * Create a Razorpay Order for consumer app checkout.
   * Frontend uses this order_id to open Razorpay checkout SDK.
   *
   * POST /api/v1/payments/orders/create
   */
  async createOrderPayment(storeId: string, orderId: string, amountPaise: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // Create Razorpay order
    const rzpOrder = await razorpayRequest('POST', '/orders', {
      amount: amountPaise,
      currency: 'INR',
      receipt: orderId.substring(0, 40),
      notes: { orderId, storeId },
    });

    // Create internal Payment record
    const payment = await this.prisma.payment.create({
      data: {
        storeId,
        source: 'ONLINE_ORDER',
        orderId,
        provider: 'RAZORPAY',
        providerOrderId: rzpOrder.id,
        amount: amountPaise / 100,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    return {
      paymentId: payment.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
    };
  }

  /**
   * Record a cash payment for a POS bill.
   *
   * POST /api/v1/payments/pos/cash
   */
  async recordCashPayment(
    storeId: string,
    billId: string,
    amountReceived: number,
    changeReturned: number,
  ) {
    const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundException('POS bill not found');
    if (bill.status !== 'DRAFT') throw new BadRequestException('Bill is not in DRAFT state');

    const payment = await this.prisma.payment.create({
      data: {
        storeId,
        source: 'POS_BILL',
        billId,
        provider: 'CASH',
        amount: amountReceived,
        currency: 'INR',
        method: 'cash',
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    // Mark bill as PAID
    await this.prisma.posBill.update({
      where: { id: billId },
      data: { status: 'PAID' },
    });

    this.eventEmitter.emit('pos.bill.paid', { billId, storeId, method: 'cash', paymentId: payment.id });

    return {
      paymentId: payment.id,
      method: 'cash',
      amountReceived,
      changeReturned,
      status: 'SUCCESS',
    };
  }

  /**
   * Get payment status by internal payment ID.
   *
   * GET /api/v1/payments/:paymentId
   */
  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { events: { orderBy: { receivedAt: 'desc' }, take: 5 } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /**
   * Razorpay webhook handler.
   * MUST be called with raw body buffer for signature verification.
   *
   * POST /api/v1/payments/razorpay/webhook
   */
  async handleWebhook(rawBody: string, signature: string) {
    const signatureValid = verifyRazorpayWebhookSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const event = payload.event as string;
    this.logger.log(`Razorpay webhook received: ${event}`);

    // Find the related internal Payment record
    const paymentData = payload.payload?.payment?.entity;
    const qrData      = payload.payload?.qr_code?.entity;

    let internalPayment: any = null;

    if (paymentData?.order_id) {
      internalPayment = await this.prisma.payment.findFirst({
        where: { providerOrderId: paymentData.order_id },
      });
    }

    if (!internalPayment && qrData?.id) {
      internalPayment = await this.prisma.payment.findFirst({
        where: { providerQrId: qrData.id },
      });
    }

    // Log the raw webhook event regardless of match
    if (internalPayment) {
      await this.prisma.paymentEvent.create({
        data: {
          paymentId: internalPayment.id,
          provider: 'RAZORPAY',
          eventType: event,
          payloadJson: payload,
          signatureValid,
          processedAt: null,
        },
      });
    }

    if (!signatureValid) {
      this.logger.warn(`Invalid webhook signature for event: ${event}`);
      // Still return 200 so Razorpay stops retrying; just don't process
      return { received: true, processed: false, reason: 'invalid_signature' };
    }

    // ── Process event ────────────────────────────────────────────────────────

    if (event === 'payment.captured' && internalPayment) {
      await this.prisma.payment.update({
        where: { id: internalPayment.id },
        data: {
          status: 'SUCCESS',
          providerPaymentId: paymentData?.id,
          method: paymentData?.method,
          paidAt: new Date(),
        },
      });

      if (internalPayment.source === 'POS_BILL' && internalPayment.billId) {
        await this.prisma.posBill.update({
          where: { id: internalPayment.billId },
          data: { status: 'PAID' },
        });
        this.eventEmitter.emit('pos.bill.paid', {
          billId: internalPayment.billId,
          storeId: internalPayment.storeId,
          method: paymentData?.method,
          paymentId: internalPayment.id,
        });
      }

      if (internalPayment.source === 'ONLINE_ORDER' && internalPayment.orderId) {
        this.eventEmitter.emit('order.payment.captured', {
          orderId: internalPayment.orderId,
          storeId: internalPayment.storeId,
          paymentId: internalPayment.id,
        });
      }

      // Mark webhook event as processed
      if (internalPayment) {
        await this.prisma.paymentEvent.updateMany({
          where: { paymentId: internalPayment.id, eventType: event, processedAt: null },
          data: { processedAt: new Date() },
        });
      }
    }

    if (event === 'payment.failed' && internalPayment) {
      await this.prisma.payment.update({
        where: { id: internalPayment.id },
        data: { status: 'FAILED', providerPaymentId: paymentData?.id },
      });
      this.eventEmitter.emit('payment.failed', {
        paymentId: internalPayment.id,
        source: internalPayment.source,
        billId: internalPayment.billId,
        orderId: internalPayment.orderId,
      });
    }

    if (event === 'refund.processed' && internalPayment) {
      await this.prisma.payment.update({
        where: { id: internalPayment.id },
        data: { status: 'REFUNDED' },
      });
    }

    return { received: true, processed: true };
  }
}
