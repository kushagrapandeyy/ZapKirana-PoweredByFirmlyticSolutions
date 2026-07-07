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
export declare class ErpValidationService {
    validateProductRow(row: ProductImportRow): ValidationError[];
    validateSupplierRow(row: SupplierImportRow): ValidationError[];
    getMargProductColumnMap(): Record<string, string>;
    getMargSupplierColumnMap(): Record<string, string>;
    extractStateCodeFromGstin(gstin: string): string | null;
    extractPanFromGstin(gstin: string): string | null;
    validateGstin(gstin: string): {
        valid: boolean;
        errors: string[];
    };
    parseDecimalSafe(value: string | undefined): number | null;
    parseBooleanFromMarg(value: string | undefined): boolean;
    normalizeMobile(mobile: string): string | null;
}
