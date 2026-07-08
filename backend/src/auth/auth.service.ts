import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
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

    // In production: Send OTP via SMS using MSG91
    if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
      try {
        const msg91Url = `https://control.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=${phone.replace('+', '')}&authkey=${process.env.MSG91_AUTH_KEY}&otp=${code}`;
        const res = await fetch(msg91Url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json() as any;
        if (json.type === 'error') {
          console.error(`MSG91 Error: ${json.message}`);
        }
      } catch (err) {
        console.error(`Failed to send OTP via MSG91:`, err);
      }
    } else {
      // In dev environment where keys aren't set, just log it.
      // NEVER return the OTP in the JSON response.
      this.logger.warn(`[DEV MODE] OTP for ${phone}: ${code} — configure MSG91_API_KEY for production SMS delivery`);
    }

    return {
      message: 'OTP sent successfully',
      expiresIn: 300, // seconds
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
          email: `${phone}@phone.zapkirana.app`, // Placeholder email for phone-only users
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

  // Scanner Login
  async scannerLogin(deviceCode: string, pin: string) {
    const device = await this.prisma.scannerDevice.findUnique({ where: { deviceCode } });
    if (!device) throw new UnauthorizedException('Invalid device code');
    if (device.status !== 'ACTIVE') throw new UnauthorizedException('Device inactive');

    // Find user by PIN within the device's store
    const user = await this.prisma.user.findFirst({
      where: { 
        pin, 
        OR: [
          { storeId: device.storeId },
          { storeRoles: { some: { storeId: device.storeId } } }
        ]
      }
    });

    if (!user) throw new UnauthorizedException('Invalid PIN');

    // Close existing sessions on this device
    const activeDeviceSessions = await this.prisma.scannerSession.findMany({
      where: { deviceId: device.id, endedAt: null }
    });
    for (const s of activeDeviceSessions) {
      const durationSeconds = Math.floor((Date.now() - s.startedAt.getTime()) / 1000);
      await this.prisma.scannerSession.update({
        where: { id: s.id },
        data: { endedAt: new Date(), durationSeconds }
      });
    }

    // Close any other active sessions for this user (prevent sharing PINs across devices)
    const activeUserSessions = await this.prisma.scannerSession.findMany({
      where: { staffId: user.id, endedAt: null }
    });
    for (const s of activeUserSessions) {
      const durationSeconds = Math.floor((Date.now() - s.startedAt.getTime()) / 1000);
      await this.prisma.scannerSession.update({
        where: { id: s.id },
        data: { endedAt: new Date(), durationSeconds }
      });
    }

    const session = await this.prisma.scannerSession.create({
      data: {
        storeId: device.storeId,
        deviceId: device.id,
        staffId: user.id,
      }
    });

    const payload = { email: user.email, sub: user.id, role: user.role, storeId: device.storeId, sessionId: session.id };
    return {
      token: this.jwtService.sign(payload),
      storeId: device.storeId,
      deviceId: device.id,
      staffId: user.id,
      sessionId: session.id,
      user: {
        id: user.id,
        name: user.name,
      }
    };
  }

  // Scanner Logout
  async scannerLogout(sessionId: string, userId: string) {
    const session = await this.prisma.scannerSession.findUnique({ where: { id: sessionId } });
    if (!session || session.staffId !== userId || session.endedAt) {
      return { success: true }; // Already logged out or invalid
    }

    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    await this.prisma.scannerSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date(), durationSeconds }
    });

    return { success: true };
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
