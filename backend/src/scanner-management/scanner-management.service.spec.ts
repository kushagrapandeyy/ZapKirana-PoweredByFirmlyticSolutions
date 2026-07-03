import { Test, TestingModule } from '@nestjs/testing';
import { ScannerManagementService } from './scanner-management.service';

describe('ScannerManagementService', () => {
  let service: ScannerManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScannerManagementService],
    }).compile();

    service = module.get<ScannerManagementService>(ScannerManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
