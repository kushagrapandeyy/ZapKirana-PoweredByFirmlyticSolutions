import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private readonly visionApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. AI features will be disabled (fallback mode).');
    }
  }

  /**
   * Safely calls Gemini API. Returns null on any failure (rate limit, network, etc)
   * to ensure AI enrichment never breaks the core application flow.
   */
  private async safeCall(prompt: string, schema?: any, systemInstruction?: string): Promise<any | null> {
    if (!this.apiKey) return null;

    try {
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      if (schema) {
        payload.generationConfig.responseMimeType = 'application/json';
        payload.generationConfig.responseSchema = schema;
      }

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.warn(`Gemini API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) return null;

      if (schema) {
        try {
          return JSON.parse(text);
        } catch (e) {
          this.logger.warn('Failed to parse Gemini JSON response');
          return null;
        }
      }

      return text;
    } catch (e) {
      this.logger.error('Error calling Gemini API', e);
      return null;
    }
  }

  // =====================================================
  // HSN & GST Suggestion
  // =====================================================
  async suggestHsnCode(name: string, category: string): Promise<{ hsnCode: string; gstRate: number; cgstRate: number; sgstRate: number; confidence: number } | null> {
    const prompt = `Product: ${name}\nCategory: ${category}\nSuggest the 8-digit Indian HSN code and GST rate for this product.`;
    
    const schema = {
      type: 'OBJECT',
      properties: {
        hsnCode: { type: 'STRING', description: '8 digit HSN code' },
        gstRate: { type: 'NUMBER', description: 'Total GST rate (e.g. 0, 5, 12, 18, 28)' },
        cgstRate: { type: 'NUMBER', description: 'CGST rate (half of total)' },
        sgstRate: { type: 'NUMBER', description: 'SGST rate (half of total)' },
        confidence: { type: 'NUMBER', description: '0 to 1 confidence score' }
      },
      required: ['hsnCode', 'gstRate', 'cgstRate', 'sgstRate', 'confidence']
    };

    return this.safeCall(prompt, schema, 'You are an Indian GST and HSN code expert for FMCG and grocery products.');
  }

  // =====================================================
  // GSTIN Validation
  // =====================================================
  async validateGstin(gstin: string): Promise<{ stateCode: string; stateName: string; pan: string; isValidFormat: boolean } | null> {
    const prompt = `Extract details from this Indian GSTIN: ${gstin}`;
    
    const schema = {
      type: 'OBJECT',
      properties: {
        stateCode: { type: 'STRING', description: 'First 2 digits' },
        stateName: { type: 'STRING', description: 'Name of the state corresponding to the code' },
        pan: { type: 'STRING', description: 'Next 10 characters representing the PAN' },
        isValidFormat: { type: 'BOOLEAN', description: 'True if it follows the 15 char GSTIN structure' }
      },
      required: ['stateCode', 'stateName', 'pan', 'isValidFormat']
    };

    return this.safeCall(prompt, schema, 'You are an Indian tax validation system.');
  }

  // =====================================================
  // ERP Import Mapping Suggestion
  // =====================================================
  async suggestImportColumnMapping(headers: string[]): Promise<Record<string, string> | null> {
    const prompt = `I am importing a CSV into a modern ERP system called Basko. The CSV has the following headers:\n${headers.join(', ')}\n\nMap these to standard Basko ERP fields: name, legacyCode, mrp, sellingPrice, category, brand, hsnSacCode, cgstRate, sgstRate, barcode, packSize. Only map if confident.`;
    
    const schema = {
      type: 'OBJECT',
      properties: {
        mapping: {
          type: 'OBJECT',
          description: 'Key is standard field, value is CSV header',
          additionalProperties: { type: 'STRING' }
        }
      },
      required: ['mapping']
    };

    const res = await this.safeCall(prompt, schema, 'You are an ERP data migration expert.');
    return res ? res.mapping : null;
  }
}
