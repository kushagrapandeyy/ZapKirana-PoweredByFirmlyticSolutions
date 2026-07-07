"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        try {
            await this.$connect();
        }
        catch (e) {
            console.warn("Database connection skipped for now pending Supabase credentials.");
        }
    }
    withStore(storeId) {
        return this.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        const tenantModels = [
                            'Product', 'Inventory', 'StockMovement', 'Supplier',
                            'PosBill', 'Order', 'ProductBarcode', 'ProductVersion',
                            'SupplierImportBatch', 'SupplierImportRow'
                        ];
                        if (tenantModels.includes(model)) {
                            if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate'].includes(operation)) {
                                if (operation === 'findUnique') {
                                    operation = 'findFirst';
                                }
                                args.where = { ...args.where, storeId };
                            }
                            else if (['create', 'createMany'].includes(operation)) {
                                if (args.data) {
                                    if (Array.isArray(args.data)) {
                                        args.data = args.data.map((d) => ({ ...d, storeId }));
                                    }
                                    else {
                                        args.data.storeId = storeId;
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
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map