import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma.service';
export declare class AuditInterceptor implements NestInterceptor {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private logToDb;
}
