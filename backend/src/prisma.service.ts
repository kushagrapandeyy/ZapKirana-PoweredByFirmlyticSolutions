import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Note: will throw if DB is not connected, but we'll mock or wait for Supabase
    try {
      await this.$connect();
    } catch (e) {
      console.warn("Database connection skipped for now pending Supabase credentials.");
    }
  }

  /**
   * Application-Level RLS (Row Level Security)
   * Returns a Prisma client extension that automatically enforces storeId isolation
   * for all multi-tenant tables.
   */
  withStore(storeId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // List of multi-tenant tables that must be isolated
            const tenantModels = [
              'Product', 'Inventory', 'StockMovement', 'Supplier', 
              'PosBill', 'Order', 'ProductBarcode', 'ProductVersion',
              'SupplierImportBatch', 'SupplierImportRow'
            ];
            
            if (tenantModels.includes(model)) {
              if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate'].includes(operation)) {
                // For findUnique, we must convert to findFirst if we inject storeId, 
                // because findUnique only accepts unique constraints.
                if (operation === 'findUnique') {
                  operation = 'findFirst';
                }
                const anyArgs = args as any;
                anyArgs.where = { ...anyArgs.where, storeId };
              } else if (['create', 'createMany'].includes(operation)) {
                const anyArgs = args as any;
                if (anyArgs.data) {
                  if (Array.isArray(anyArgs.data)) {
                    anyArgs.data = anyArgs.data.map((d: any) => ({ ...d, storeId }));
                  } else {
                    anyArgs.data.storeId = storeId;
                  }
                }
              }
            }
            return query(args);
          },
        },
      },
    });
  }
}
