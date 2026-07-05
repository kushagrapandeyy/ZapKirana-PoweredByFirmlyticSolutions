import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  createTicket(@Body() createTicketDto: any, @Request() req: any) {
    return this.supportService.createTicket({
      ...createTicketDto,
      customerId: req.user.role === 'CUSTOMER' ? req.user.id : undefined,
    });
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  getTickets(@Query() query: any) {
    return this.supportService.getTickets(query);
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  getTicket(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateTicketStatus(id, status as any);
  }

  @Post('intervene/order/:id')
  @UseGuards(JwtAuthGuard)
  interveneOrder(
    @Param('id') orderId: string, 
    @Body('status') status: OrderStatus, 
    @Body('reason') reason: string, 
    @Request() req: any
  ) {
    return this.supportService.interveneOrder(orderId, status, reason, req.user.id);
  }
}
