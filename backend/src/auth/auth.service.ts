import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // Email/Password Registration
  async register(data: { email: string; password: string; name: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    if (data.phone) {
      const phoneExists = await this.prisma.user.findFirst({ where: { phone: data.phone } });
      if (phoneExists) throw new ConflictException('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone || null,
        role: 'CUSTOMER',
        isVerified: false,
      },
    });

    const { password, ...result } = user;
    return this.login(result);
  }

  // Email/Password Login
  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({ 
      where: { 
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      } 
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  // Phone OTP - Request OTP
  async requestOtp(phone: string) {
    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Find or create user by phone
    let user = await this.prisma.user.findFirst({ where: { phone } });

    await this.prisma.otpCode.create({
      data: {
        userId: user?.id || null,
        phone,
        code,
        expiresAt,
      },
    });

    // In production: Send OTP via SMS (Twilio, MSG91, etc.)
    // For now, return it in response for testing
    console.log(`📱 OTP for ${phone}: ${code}`);

    return {
      message: 'OTP sent successfully',
      expiresIn: 300, // seconds
      // Remove this in production:
      _devOtp: code,
    };
  }

  // Phone OTP - Verify OTP
  async verifyOtp(phone: string, code: string) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Find or create user
    let user = await this.prisma.user.findFirst({ where: { phone } });
    
    if (!user) {
      // Create new user from phone auth
      user = await this.prisma.user.create({
        data: {
          email: `${phone}@phone.basko.app`, // Placeholder email for phone-only users
          phone,
          role: 'CUSTOMER',
          isVerified: true,
        },
      });
    } else {
      // Mark as verified
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const { password, ...result } = user;
    return this.login(result);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, storeId: user.storeId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeId: user.storeId,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      }
    };
  }

  // Update push notification token
  async updatePushToken(userId: string, pushToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
  }

  // Get user profile
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        savedAddresses: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { password, ...result } = user;
    return result;
  }
}
