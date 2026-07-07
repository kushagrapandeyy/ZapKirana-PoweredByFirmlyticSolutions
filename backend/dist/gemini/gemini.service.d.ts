export declare class GeminiService {
    private readonly logger;
    private readonly apiKey;
    private readonly apiUrl;
    private readonly visionApiUrl;
    constructor();
    private safeCall;
    suggestHsnCode(name: string, category: string): Promise<{
        hsnCode: string;
        gstRate: number;
        cgstRate: number;
        sgstRate: number;
        confidence: number;
    } | null>;
    validateGstin(gstin: string): Promise<{
        stateCode: string;
        stateName: string;
        pan: string;
        isValidFormat: boolean;
    } | null>;
    suggestImportColumnMapping(headers: string[]): Promise<Record<string, string> | null>;
}
