import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface ExtractedField {
  value: string | number | boolean | null;
  confidence: number;
}

export interface ProductMasterExtraction {
  productCode: ExtractedField;
  productName: ExtractedField;
  unit: ExtractedField;
  company: ExtractedField;
  category: ExtractedField;
  hsnSac: ExtractedField;
  mrp: ExtractedField;
  sgstPercent: ExtractedField;
  cgstPercent: ExtractedField;
  igstPercent: ExtractedField;
  shelfLifeDays: ExtractedField;
  // Add other required fields...
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Mock implementation of Gemini / Vision API extraction.
   * In a real implementation, this would use @google/generative-ai.
   */
  async extractProductMaster(rawText: string, storeId: string) {
    this.logger.log(`Extracting Product Master from ${rawText.length} characters`);
    
    // Simulate AI extraction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated parsed response based on common Marg OCR text
    const parsedData: Record<string, ExtractedField> = {
      productCode: { value: '001078', confidence: 0.95 },
      productName: { value: 'AMUL CHAZ 200ML.*15', confidence: 0.96 },
      unit: { value: 'Pcs', confidence: 0.98 },
      company: { value: 'AMUL INDIA LTD.', confidence: 0.92 },
      category: { value: 'DRINK', confidence: 0.90 },
      hsnSac: { value: '04039090', confidence: 0.94 },
      mrp: { value: 15.0, confidence: 0.98 },
      sgstPercent: { value: 2.5, confidence: 0.99 },
      cgstPercent: { value: 2.5, confidence: 0.99 },
      igstPercent: { value: 5.0, confidence: 0.97 },
      shelfLifeDays: { value: 258, confidence: 0.88 },
    };

    // Validate logic
    this.validateProductExtraction(parsedData);

    // Save as DRAFT extraction
    const extraction = await this.prisma.scannerExtraction.create({
      data: {
        storeId,
        type: 'PRODUCT_MASTER',
        status: 'DRAFT',
        rawText,
        confidenceScore: this.calculateAverageConfidence(parsedData),
        fields: {
          create: Object.entries(parsedData).map(([key, field]) => ({
            fieldKey: key,
            extractedValue: String(field.value),
            confidence: field.confidence,
            finalValue: String(field.value)
          }))
        }
      },
      include: { fields: true }
    });

    return extraction;
  }

  async extractSupplierLedger(rawText: string, storeId: string) {
    this.logger.log(`Extracting Supplier Ledger from ${rawText.length} characters`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const parsedData: Record<string, ExtractedField> = {
      ledgerName: { value: 'BALAJI TRADERS', confidence: 0.95 },
      supplierName: { value: 'BALAJI TRADERS', confidence: 0.92 },
      accountGroup: { value: 'SUNDRY CREDITORS', confidence: 0.99 },
      gstin: { value: '27AADCB2230M1Z2', confidence: 0.97 },
      city: { value: 'MUMBAI', confidence: 0.90 },
      openingBalance: { value: 12500.50, confidence: 0.88 },
      openingBalanceType: { value: 'Cr', confidence: 0.96 },
    };

    const extraction = await this.prisma.scannerExtraction.create({
      data: {
        storeId,
        type: 'SUPPLIER_LEDGER',
        status: 'DRAFT',
        rawText,
        confidenceScore: this.calculateAverageConfidence(parsedData),
        fields: {
          create: Object.entries(parsedData).map(([key, field]) => ({
            fieldKey: key,
            extractedValue: String(field.value),
            confidence: field.confidence,
            finalValue: String(field.value)
          }))
        }
      },
      include: { fields: true }
    });

    return extraction;
  }

  private validateProductExtraction(data: Record<string, ExtractedField>) {
    // Basic tax rule: SGST + CGST should equal IGST (approx)
    if (data.sgstPercent?.value && data.cgstPercent?.value && data.igstPercent?.value) {
      const sum = Number(data.sgstPercent.value) + Number(data.cgstPercent.value);
      if (sum !== Number(data.igstPercent.value)) {
        // Lower confidence to flag for review
        data.igstPercent.confidence = 0.5;
        data.sgstPercent.confidence = 0.5;
        data.cgstPercent.confidence = 0.5;
      }
    }
  }

  private calculateAverageConfidence(data: Record<string, ExtractedField>) {
    const values = Object.values(data);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, field) => acc + field.confidence, 0);
    return sum / values.length;
  }
}
