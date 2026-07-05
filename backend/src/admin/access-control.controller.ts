import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/access-control')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN)
export class AccessControlController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('staff')
  async getPlatformStaff() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: ['ORG_ADMIN', 'OWNER', 'MANAGER']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    });
  }

  @Post('invite')
  async inviteStaff(@Body() body: { name: string; email: string; role: Role }, @Request() req: any) {
    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        password: 'defaultPassword123', // In a real system, send an email to set password
      }
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'INVITE_STAFF',
        entityType: 'User',
        entityId: user.id,
        userId: req.user.id,
        details: `Invited ${body.name} as ${body.role}`,
      }
    });

    return user;
  }

  @Patch('staff/:id/role')
  async updateRole(@Param('id') id: string, @Body() body: { role: Role }, @Request() req: any) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: body.role }
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE_STAFF_ROLE',
        entityType: 'User',
        entityId: user.id,
        userId: req.user.id,
        details: `Changed role of ${user.name} to ${body.role}`,
      }
    });

    return user;
  }
}
