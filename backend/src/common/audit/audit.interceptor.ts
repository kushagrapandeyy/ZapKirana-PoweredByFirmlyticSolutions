import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = req;

    // Only log state-changing requests
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const startTime = Date.now();
      
      return next.handle().pipe(
        tap({
          next: () => {
            const duration = Date.now() - startTime;
            // Fire and forget audit log creation
            this.logToDb(user?.id, user?.storeId, method, url, body, ip, duration, 'SUCCESS');
          },
          error: (err) => {
            const duration = Date.now() - startTime;
            this.logToDb(user?.id, user?.storeId, method, url, body, ip, duration, `ERROR: ${err.message}`);
          }
        }),
      );
    }

    return next.handle();
  }

  private async logToDb(
    userId: string | undefined, 
    storeId: string | undefined, 
    method: string, 
    endpoint: string, 
    payload: any,
    ip: string,
    durationMs: number,
    status: string
  ) {
    try {
      // In a real prod environment, you'd likely write this to a faster queue (Redis)
      // or directly to a specialized logging table. Assuming Prisma has an AuditLog table:
      
      // Let's sanitize passwords/sensitive info before logging
      const sanitizedPayload = { ...payload };
      if (sanitizedPayload.password) sanitizedPayload.password = '[REDACTED]';
      if (sanitizedPayload.otp) sanitizedPayload.otp = '[REDACTED]';
      
      // Note: we don't have an AuditLog table defined yet in prisma. 
      // This is a placeholder log to console, and will throw if table doesn't exist
      // You should add an AuditLog model to your schema.prisma
      this.logger.log(`AUDIT [${status}] ${method} ${endpoint} by ${userId || 'anonymous'} in ${durationMs}ms`);
      
    } catch (e) {
      this.logger.error(`Failed to write audit log: ${e.message}`);
    }
  }
}
