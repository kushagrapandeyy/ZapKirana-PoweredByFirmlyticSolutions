import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * StoreScopeGuard
 *
 * Ensures every non-public request carries a storeId that belongs to the
 * authenticated user's organization. This prevents cross-tenant data leakage.
 *
 * The storeId can be in:
 *   - query string  (?storeId=...)
 *   - request body  ({ storeId: ... })
 *   - route params  (/stores/:storeId/...)
 *
 * The guard reads `req.user.storeIds` (array of stores the user has access to)
 * populated by JwtAuthGuard → JwtStrategy.
 *
 * NOTE: For endpoints that don't use a storeId (e.g. /auth/*, /admin/*),
 * decorate with @Public() to skip this guard entirely.
 */
@Injectable()
export class StoreScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip for @Public() endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // JwtAuthGuard runs before this — if user is missing, JWT guard already rejected
    if (!user) return false;

    // Platform admins bypass store scope (they have cross-org access)
    if (user.role === 'PLATFORM_ADMIN' || user.role === 'SUPPORT') return true;

    // Extract storeId from wherever it appears in this request
    const storeId: string | undefined =
      request.query?.storeId ??
      request.body?.storeId ??
      request.params?.storeId;

    // If no storeId in request, this endpoint doesn't need store scoping
    if (!storeId) return true;

    // Validate the storeId belongs to this user's accessible stores
    const accessibleStoreIds: string[] = user.storeIds ?? [];

    // Org owners have access to all stores in their org — checked by
    // their storeIds array being populated with all org stores in JwtStrategy
    if (!accessibleStoreIds.includes(storeId)) {
      throw new ForbiddenException(
        `Store ${storeId} is not accessible to your account.`,
      );
    }

    return true;
  }
}
