import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET || 'SUPER_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    // Supabase payload structure: { sub: string, email?: string, phone?: string, role?: string, app_metadata?: any, user_metadata?: any }
    let user = null;
    
    // We try to find the user by id first if they exist locally with the same ID, 
    // otherwise fallback to email or phone since Supabase might generate a new auth.users ID.
    user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: payload.sub },
          ...(payload.email ? [{ email: payload.email }] : []),
          ...(payload.phone ? [{ phone: payload.phone }] : []),
        ]
      }
    });

    if (!user) {
      // Auto-provision user if they signed up via Supabase but don't exist in Prisma yet.
      user = await this.prisma.user.create({
        data: {
          id: payload.sub,
          email: payload.email || `${payload.phone || payload.sub}@phone.zapkirana.app`,
          phone: payload.phone || null,
          name: payload.user_metadata?.name || 'Zapkirana User',
          role: payload.app_metadata?.role || 'CUSTOMER',
          isVerified: true,
        }
      });
    }

    return { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      storeId: user.storeId, 
      supabaseId: payload.sub 
    };
  }
}
