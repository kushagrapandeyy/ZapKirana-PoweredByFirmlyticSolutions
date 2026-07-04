import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Public()
  @Post()
  create(@Body() body: any) {
    return this.addressesService.createAddress(body);
  }

  @Public()
  @Get()
  getAll(@Query('userId') userId: string) {
    if (!userId) {
      return [];
    }
    return this.addressesService.getUserAddresses(userId);
  }

  @Public()
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.addressesService.updateAddress(id, body);
  }

  @Public()
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.addressesService.deleteAddress(id);
  }
}
