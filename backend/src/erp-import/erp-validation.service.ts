import { Injectable, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export interface ProductImportRow {
  CODE?: string;
  PRODUCT?: string;
  UNIT?: string;
  TYPE?: string;
  HIDE?: string;
  BARCODE?: string;
  PACKING?: string;
  DECIMAL?: string;
  ITEM_TYPE?: string;
  RACK_NO?: string;
  COLOR_TYPE?: string;
  COMPANY?: string;
  GROUP?: string;
  CATEGORY?: string;
  HSN_SAC?: string;
  LOCAL_TAX_STATUS?: string;
  CENTRAL_TAX_STATUS?: string;
  MRP?: string;
  RATE_A?: string;
  RATE_B?: string;
  RATE_C?: string;
  P_RATE?: string;
  COST_PCS?: string;
  CONV_BOX?: string;
  MINIMUM_QTY?: string;
  MAXIMUM_QTY?: string;
  DEFAULT_SALE_QTY?: string;
  REORDER_QTY?: string;
  SHELFLIFE?: string;
  SGST?: string;
  CGST?: string;
  IGST?: string;
  CESS?: string;
  NEGATIVE?: string;
  DISCOUNT?: string;
  ITEM_DISC_1?: string;
  DISC_2?: string;
  SPECIAL_DISC?: string;
  MAX_DISC_PERCENT?: string;
  [key: string]: string | undefined;
}

export interface SupplierImportRow {
  LEDGER_NAME?: string;
  STATION?: string;
  ACCOUNT_GROUP?: string;
  BALANCING_METHOD?: string;
  OPENING?: string;
  CR_DR?: string;
  MAIL_TO?: string;
  ADDRESS?: string;
  PIN_CODE?: string;
  EMAIL?: string;
  WEBSITE?: string;
  CONTACT_PERSON?: string;
  DESIGNATION?: string;
  PHONE_OFF?: string;
  PHONE_RES?: string;
  MOBILE?: string;
  FAX?: string;
  FREEZE_UPTO?: string;
  REG_NO?: string;
  GST_HEADING?: string;
  GSTIN?: string;
  TIN_NO?: string;
  FOOD_LICENSE_NO?: string;
  PAN?: string;
  LEDGER_CATEGORY?: string;
  STATE?: string;
  LEDGER_TYPE?: string;
  COUNTRY?: string;
  HOLD_PAYMENT?: string;
  HOLD_PAYMENT_PERCENT?: string;
  LEDGER_DATE?: string;
  [key: string]: string | undefined;
}

export interface ValidationError {
  field: string;
  legacyValue?: string;
  errorCode: string;
  errorMessage: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}

@Injectable()
export class ErpValidationService {
  // =====================================================
  // PRODUCT VALIDATIONS
  // =====================================================

  validateProductRow(row: ProductImportRow): ValidationError[] {
    const errors: ValidationError[] = [];

    // legacyCode must be treated as string
    if (row.CODE !== undefined && row.CODE !== null) {
      if (typeof row.CODE !== 'string') {
        errors.push({
          field: 'CODE',
          legacyValue: String(row.CODE),
          errorCode: 'CODE_MUST_BE_STRING',
          errorMessage: 'Product code must be treated as string to preserve leading zeros (e.g. 001078)',
          severity: 'ERROR',
        });
      }
    }

    // MRP cannot be negative
    if (row.MRP !== undefined) {
      const mrp = this.parseDecimalSafe(row.MRP);
      if (mrp !== null && mrp < 0) {
        errors.push({ field: 'MRP', legacyValue: row.MRP, errorCode: 'MRP_NEGATIVE', errorMessage: 'MRP cannot be negative', severity: 'ERROR' });
      }
    }

    // Selling prices cannot be negative
    for (const rateField of ['RATE_A', 'RATE_B', 'RATE_C']) {
      if (row[rateField] !== undefined) {
        const rate = this.parseDecimalSafe(row[rateField]!);
        if (rate !== null && rate < 0) {
          errors.push({ field: rateField, legacyValue: row[rateField], errorCode: `${rateField}_NEGATIVE`, errorMessage: `${rateField} cannot be negative`, severity: 'ERROR' });
        }
      }
    }

    // Purchase rate cannot be negative
    if (row.P_RATE !== undefined) {
      const rate = this.parseDecimalSafe(row.P_RATE);
      if (rate !== null && rate < 0) {
        errors.push({ field: 'P_RATE', legacyValue: row.P_RATE, errorCode: 'PURCHASE_RATE_NEGATIVE', errorMessage: 'Purchase rate cannot be negative', severity: 'ERROR' });
      }
    }

    // CGST + SGST should equal IGST (±0.01 tolerance)
    if (row.CGST !== undefined && row.SGST !== undefined && row.IGST !== undefined) {
      const cgst = this.parseDecimalSafe(row.CGST) ?? 0;
      const sgst = this.parseDecimalSafe(row.SGST) ?? 0;
      const igst = this.parseDecimalSafe(row.IGST) ?? 0;
      if (Math.abs(cgst + sgst - igst) > 0.01) {
        errors.push({
          field: 'GST_RATES',
          legacyValue: `CGST:${row.CGST} SGST:${row.SGST} IGST:${row.IGST}`,
          errorCode: 'GST_MISMATCH',
          errorMessage: `CGST(${cgst}) + SGST(${sgst}) does not equal IGST(${igst})`,
          severity: 'WARNING',
        });
      }
    }

    // HSN/SAC — must be string, allow leading zeros
    if (row.HSN_SAC !== undefined && row.HSN_SAC !== '') {
      if (!/^\d{4,8}$/.test(row.HSN_SAC.trim())) {
        errors.push({ field: 'HSN_SAC', legacyValue: row.HSN_SAC, errorCode: 'HSN_INVALID_FORMAT', errorMessage: 'HSN/SAC must be 4-8 numeric digits, stored as string', severity: 'WARNING' });
      }
    }

    // Reorder quantity cannot be less than zero
    if (row.REORDER_QTY !== undefined) {
      const qty = this.parseDecimalSafe(row.REORDER_QTY);
      if (qty !== null && qty < 0) {
        errors.push({ field: 'REORDER_QTY', legacyValue: row.REORDER_QTY, errorCode: 'REORDER_QTY_NEGATIVE', errorMessage: 'Reorder quantity cannot be negative', severity: 'ERROR' });
      }
    }

    // Shelf life must be integer
    if (row.SHELFLIFE !== undefined && row.SHELFLIFE !== '') {
      const days = Number(row.SHELFLIFE);
      if (!Number.isInteger(days) || days < 0) {
        errors.push({ field: 'SHELFLIFE', legacyValue: row.SHELFLIFE, errorCode: 'SHELFLIFE_NOT_INTEGER', errorMessage: 'Shelf life must be a non-negative integer (days)', severity: 'ERROR' });
      }
    }

    // BARCODE — must be present and not empty for scannable products
    if (!row.BARCODE || row.BARCODE.trim() === '') {
      errors.push({ field: 'BARCODE', legacyValue: row.BARCODE, errorCode: 'BARCODE_MISSING', errorMessage: 'No barcode provided — product will not be scannable', severity: 'WARNING' });
    }

    return errors;
  }

  // =====================================================
  // SUPPLIER / LEDGER VALIDATIONS
  // =====================================================

  validateSupplierRow(row: SupplierImportRow): ValidationError[] {
    const errors: ValidationError[] = [];

    // Ledger Name is required
    if (!row.LEDGER_NAME || row.LEDGER_NAME.trim() === '') {
      errors.push({ field: 'LEDGER_NAME', errorCode: 'LEDGER_NAME_REQUIRED', errorMessage: 'Ledger/Supplier name is required', severity: 'ERROR' });
    }

    // GSTIN validation
    if (row.GSTIN && row.GSTIN.trim() !== '') {
      const gstin = row.GSTIN.trim().toUpperCase();
      if (gstin.length !== 15) {
        errors.push({ field: 'GSTIN', legacyValue: row.GSTIN, errorCode: 'GSTIN_NOT_15_CHARS', errorMessage: 'GSTIN must be exactly 15 characters', severity: 'ERROR' });
      }

      // GSTIN[0:2] must match state code
      if (row.STATE) {
        const stateCodeFromGstin = gstin.substring(0, 2);
        const stateCode = row.STATE.trim().substring(0, 2);
        if (stateCodeFromGstin !== stateCode) {
          errors.push({
            field: 'GSTIN_STATE_MISMATCH',
            legacyValue: `GSTIN:${row.GSTIN} STATE:${row.STATE}`,
            errorCode: 'GSTIN_STATE_CODE_MISMATCH',
            errorMessage: `GSTIN first two digits (${stateCodeFromGstin}) do not match state code (${stateCode})`,
            severity: 'WARNING',
          });
        }
      }

      // PAN should match GSTIN[2:12]
      if (row.PAN && row.PAN.trim() !== '') {
        const panFromGstin = gstin.substring(2, 12);
        const pan = row.PAN.trim().toUpperCase();
        if (panFromGstin !== pan) {
          errors.push({
            field: 'PAN_GSTIN_MISMATCH',
            legacyValue: `GSTIN:${row.GSTIN} PAN:${row.PAN}`,
            errorCode: 'PAN_DOES_NOT_MATCH_GSTIN',
            errorMessage: `PAN (${pan}) does not match characters 3-12 of GSTIN (${panFromGstin})`,
            severity: 'WARNING',
          });
        }
      }
    }

    // Opening balance must have Cr/Dr direction
    if (row.OPENING && row.OPENING.trim() !== '') {
      if (!row.CR_DR || !['CR', 'DR'].includes(row.CR_DR.trim().toUpperCase())) {
        errors.push({ field: 'CR_DR', legacyValue: row.CR_DR, errorCode: 'BALANCE_TYPE_MISSING', errorMessage: 'Opening balance requires a Cr/Dr direction (CR or DR)', severity: 'ERROR' });
      }
    }

    // Hold payment percentage must be 0-100
    if (row.HOLD_PAYMENT_PERCENT !== undefined && row.HOLD_PAYMENT_PERCENT !== '') {
      const pct = this.parseDecimalSafe(row.HOLD_PAYMENT_PERCENT);
      if (pct !== null && (pct < 0 || pct > 100)) {
        errors.push({ field: 'HOLD_PAYMENT_PERCENT', legacyValue: row.HOLD_PAYMENT_PERCENT, errorCode: 'HOLD_PERCENT_OUT_OF_RANGE', errorMessage: 'Hold payment percentage must be between 0 and 100', severity: 'ERROR' });
      }
    }

    // Email validation
    if (row.EMAIL && row.EMAIL.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.EMAIL.trim())) {
        errors.push({ field: 'EMAIL', legacyValue: row.EMAIL, errorCode: 'EMAIL_INVALID', errorMessage: 'Email format is invalid', severity: 'WARNING' });
      }
    }

    // Mobile normalization
    if (row.MOBILE && row.MOBILE.trim() !== '') {
      const normalized = this.normalizeMobile(row.MOBILE);
      if (!normalized) {
        errors.push({ field: 'MOBILE', legacyValue: row.MOBILE, errorCode: 'MOBILE_INVALID', errorMessage: 'Mobile number cannot be normalized to Indian format', severity: 'WARNING' });
      }
    }

    return errors;
  }

  // =====================================================
  // MARG ERP COLUMN MAPPING
  // =====================================================

  getMargProductColumnMap(): Record<string, string> {
    return {
      'CODE': 'storeProduct.legacyCode',
      'PRODUCT': 'product.name',
      'UNIT': 'product.baseUnit',
      'TYPE': 'storeProduct.type',
      'ITEM TYPE': 'storeProduct.itemType',
      'STATUS': 'storeProduct.status',
      'HIDE': 'storeProduct.isHidden',
      'BARCODE': 'storeProductBarcode.barcode',
      'PACKING': 'storeProduct.packagingText',
      'DECIMAL': 'storeProduct.allowDecimalQty',
      'COLOR TYPE': 'storeProduct.colorType',
      'COMPANY': 'brand.name',
      'GROUP': 'productGroup.name',
      'CATEGORY': 'globalCategory.name',
      'HSN/SAC': 'productTaxProfile.hsnSacCode',
      'LOCAL TAX STATUS': 'productTaxProfile.localTaxabilityStatus',
      'CENTRAL TAX STATUS': 'productTaxProfile.centralTaxabilityStatus',
      'M.R.P': 'storeProductPricing.mrp',
      'Rate-A': 'storeProductPricing.rateA',
      'Rate-B': 'storeProductPricing.rateB',
      'Rate-C': 'storeProductPricing.rateC',
      'P.RATE': 'storeProductPricing.purchaseRate',
      'COST/PCS': 'storeProductPricing.costPerPiece',
      'SGST %': 'productTaxProfile.sgstRate',
      'CGST %': 'productTaxProfile.cgstRate',
      'IGST %': 'productTaxProfile.igstRate',
      'CESS %': 'productTaxProfile.cessRate',
      'CONV.BOX': 'productInventoryPolicy.boxConversionQty',
      'MINIMUM QTY': 'productInventoryPolicy.minimumQty',
      'MAXIMUM QTY': 'productInventoryPolicy.maximumQty',
      'DEFAULT SALE QTY': 'productInventoryPolicy.defaultSaleQty',
      'REORDER QTY': 'productInventoryPolicy.reorderQty',
      'SHELFLIFE': 'productInventoryPolicy.shelfLifeDays',
      'NEGATIVE': 'productInventoryPolicy.allowNegativeStock',
      'DISCOUNT': 'productDiscountPolicy.discountApplicable',
      'ITEM DISC-1': 'productDiscountPolicy.itemDiscount1Percent',
      'DISC-2': 'productDiscountPolicy.itemDiscount2Percent',
      'SPECIAL DISC': 'productDiscountPolicy.specialDiscountPercent',
      'MAXIMUM DISCOUNT %': 'productDiscountPolicy.maximumDiscountPercent',
      'V.DIS ON': 'productDiscountPolicy.visibleDiscountOn',
      'SECOND DISCOUNT': 'productDiscountPolicy.secondDiscountPercent',
      'ON QUANTITY': 'productDiscountPolicy.appliesOnQuantity',
      'PURCHASE DISCOUNT': 'productDiscountPolicy.purchaseDiscountPercent',
      'DISC LESS': 'productDiscountPolicy.discountLessPercent',
      'F6/RATE ±': 'productDiscountPolicy.rateOverrideAllowed',
      'RACK NO': 'productRackLocation.rackNo',
      'MANUFACTURER F3': 'storeProduct.manufacturerLegacyRef',
      'FREE SCHEME': 'productScheme.schemeType',
      'VALID FROM': 'productScheme.validFrom',
    };
  }

  getMargSupplierColumnMap(): Record<string, string> {
    return {
      'Ledger Name': 'partyLedger.name',
      'Station': 'partyLedger.station',
      'Account Group': 'partyLedger.accountGroup',
      'Balancing Method': 'partyLedger.balancingMethod',
      'Opening': 'ledgerOpeningBalance.amount',
      'Cr/Dr': 'ledgerOpeningBalance.balanceType',
      'Mail To': 'supplierContact.mailToName',
      'Address': 'supplierAddress.addressLine1',
      'Pin Code': 'supplierAddress.pinCode',
      'E-Mail': 'supplierContact.email',
      'Website': 'supplierContact.website',
      'Contact Person': 'supplierContact.name',
      'Designation': 'supplierContact.designation',
      'Phone No. Off.': 'supplierContact.officePhone',
      'Phone No. Res.': 'supplierContact.residencePhone',
      'Mobile': 'supplierContact.mobile',
      'Fax No.': 'supplierContact.fax',
      'Freeze Upto': 'partyLedger.freezeUpto',
      'Reg. No.': 'supplierTaxProfile.registrationNumber',
      'GST Heading': 'supplierTaxProfile.gstHeading',
      'GSTIN': 'supplierTaxProfile.gstin',
      'VAT Heading': 'supplierTaxProfile.vatNumber',
      'TIN No.': 'supplierTaxProfile.tinNumber',
      'Food Licence No.': 'supplierTaxProfile.foodLicenseNumber',
      'I.T. PAN No.': 'supplierTaxProfile.pan',
      'Bill Import': 'partyLedger.billImportSource',
      'Ledger Category': 'partyLedger.category',
      'State': 'supplierAddress.stateName',
      'Ledger Type': 'partyLedger.ledgerType',
      'Country': 'supplierAddress.country',
      'Color': 'partyLedger.colorType',
      'Hide': 'partyLedger.isHidden',
      'Hold Payment': 'supplierPaymentPolicy.holdPayment',
      'Hold Payment %': 'supplierPaymentPolicy.holdPaymentPercent',
      'Ledger Date': 'partyLedger.ledgerDate',
      'ERP to ERP': 'partyLedger.erpToErpEnabled',
    };
  }

  // =====================================================
  // GSTIN UTILITIES
  // =====================================================

  extractStateCodeFromGstin(gstin: string): string | null {
    if (!gstin || gstin.length < 2) return null;
    return gstin.substring(0, 2);
  }

  extractPanFromGstin(gstin: string): string | null {
    if (!gstin || gstin.length < 12) return null;
    return gstin.substring(2, 12);
  }

  validateGstin(gstin: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const g = gstin.trim().toUpperCase();
    if (g.length !== 15) errors.push('GSTIN must be exactly 15 characters');
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) {
      errors.push('GSTIN format is invalid');
    }
    return { valid: errors.length === 0, errors };
  }

  // =====================================================
  // HELPERS
  // =====================================================

  parseDecimalSafe(value: string | undefined): number | null {
    if (!value || value.trim() === '') return null;
    const cleaned = value.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  parseBooleanFromMarg(value: string | undefined): boolean {
    if (!value) return false;
    const lower = value.trim().toLowerCase();
    return ['yes', 'y', 'true', '1', 'applicable'].includes(lower);
  }

  normalizeMobile(mobile: string): string | null {
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    return null;
  }
}
