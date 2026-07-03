/**
 * @Public()
 *
 * Marks a route as publicly accessible (no JWT required).
 * Applied to auth endpoints only. Every other route is JWT-protected by default
 * through the GlobalJwtAuthGuard registered in app.module.ts.
 *
 * Allowed public routes:
 *   POST /auth/otp/request
 *   POST /auth/otp/verify
 *   POST /auth/login
 *   GET  /discovery/stores-nearby
 *   POST /discovery/suggest-store
 *   POST /payments/razorpay/webhook
 *   GET  /health
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
