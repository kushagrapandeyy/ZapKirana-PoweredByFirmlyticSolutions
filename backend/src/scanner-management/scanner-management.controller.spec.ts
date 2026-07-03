import { Test, TestingModule } from '@nestjs/testing';
import { ScannerManagementController } from './scanner-management.controller';

describe('ScannerManagementController', () => {
  let controller: ScannerManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScannerManagementController],
    }).compile();

    controller = module.get<ScannerManagementController>(ScannerManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
