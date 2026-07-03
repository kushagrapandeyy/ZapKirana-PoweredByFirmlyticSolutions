import { Controller, Post, Body, Get, Patch, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Email/Password Login
  @Public()
  @Post('login')
  async login(@Body() body: { email?: string; phone?: string; password: string }) {
    const identifier = body.email || body.phone;
    if (!identifier || !body.password) {
      throw new Error('Email/Phone and password required');
    }
    const user = await this.authService.validateUser(identifier, body.password);
    return this.authService.login(user);
  }

  // Email/Password Registration
  @Public()
  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string; phone?: string }) {
    return this.authService.register(body);
  }

  // Phone OTP - Request
  @Public()
  @Post('otp/request')
  async requestOtp(@Body() body: { phone: string }) {
    return this.authService.requestOtp(body.phone);
  }

  // Phone OTP - Verify
  @Public()
  @Post('otp/verify')
  async verifyOtp(@Body() body: { phone: string; code: string }) {
    return this.authService.verifyOtp(body.phone, body.code);
  }

  // Get current user profile
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  // Update push notification token
  @UseGuards(JwtAuthGuard)
  @Patch('push-token')
  async updatePushToken(@Request() req: any, @Body() body: { pushToken: string }) {
    return this.authService.updatePushToken(req.user.id, body.pushToken);
  }
}
