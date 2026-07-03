import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class StoreScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // ORG_ADMIN can access any store
    if (user.role === 'ORG_ADMIN') {
      return true;
    }

    // Extract storeId from possible locations
    const requestedStoreId = 
      req.body?.storeId || 
      req.query?.storeId || 
      req.params?.storeId;

    // If the endpoint doesn't involve a storeId, let it pass (or another guard will catch it)
    if (!requestedStoreId) {
      return true;
    }

    // If the user doesn't have a storeId in their JWT token, they can't access store-scoped data
    if (!user.storeId) {
      throw new ForbiddenException('User is not assigned to any store');
    }

    if (requestedStoreId !== user.storeId) {
      throw new ForbiddenException(`Cross-tenant violation: You do not have access to store ${requestedStoreId}`);
    }

    return true;
  }
}
