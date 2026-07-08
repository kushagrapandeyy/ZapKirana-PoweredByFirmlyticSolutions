import { TillService } from './till.service';
export declare class TillController {
    private readonly tillService;
    constructor(tillService: TillService);
    getActiveTill(storeId: string): Promise<({
        transactions: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.TillTransactionType;
            reason: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            tillId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        status: import(".prisma/client").$Enums.TillStatus;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        expectedBalance: import("@prisma/client/runtime/library").Decimal;
        closingBalance: import("@prisma/client/runtime/library").Decimal | null;
        discrepancy: import("@prisma/client/runtime/library").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }) | null>;
    openTill(body: {
        storeId: string;
        openingBalance: number;
    }): Promise<{
        id: string;
        storeId: string;
        status: import(".prisma/client").$Enums.TillStatus;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        expectedBalance: import("@prisma/client/runtime/library").Decimal;
        closingBalance: import("@prisma/client/runtime/library").Decimal | null;
        discrepancy: import("@prisma/client/runtime/library").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }>;
    logTransaction(tillId: string, body: {
        type: 'CASH_IN' | 'CASH_OUT' | 'EXPENSE' | 'SALE';
        amount: number;
        reason?: string;
    }): Promise<({
        transactions: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.TillTransactionType;
            reason: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            tillId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        status: import(".prisma/client").$Enums.TillStatus;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        expectedBalance: import("@prisma/client/runtime/library").Decimal;
        closingBalance: import("@prisma/client/runtime/library").Decimal | null;
        discrepancy: import("@prisma/client/runtime/library").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }) | null>;
    closeTill(tillId: string, body: {
        actualClosingBalance: number;
    }): Promise<{
        id: string;
        storeId: string;
        status: import(".prisma/client").$Enums.TillStatus;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        expectedBalance: import("@prisma/client/runtime/library").Decimal;
        closingBalance: import("@prisma/client/runtime/library").Decimal | null;
        discrepancy: import("@prisma/client/runtime/library").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }>;
}
