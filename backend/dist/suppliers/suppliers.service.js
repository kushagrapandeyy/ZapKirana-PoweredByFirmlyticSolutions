"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let SuppliersService = class SuppliersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLedgerView(partyLedgerId) {
        const ledger = await this.prisma.partyLedger.findUnique({
            where: { id: partyLedgerId },
            include: {
                openingBalances: { orderBy: { createdAt: 'desc' } },
                contacts: { orderBy: { isPrimary: 'desc' } },
                addresses: true,
                taxProfile: true,
                paymentPolicy: true,
                documents: { orderBy: { createdAt: 'desc' } },
                supplierProfile: { include: { supplier: true } },
                auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
            },
        });
        if (!ledger)
            throw new common_1.NotFoundException(`PartyLedger ${partyLedgerId} not found`);
        return ledger;
    }
    async listLedgers(storeId, opts) {
        return this.prisma.partyLedger.findMany({
            where: {
                storeId,
                ...(opts?.accountGroup ? { accountGroup: { contains: opts.accountGroup } } : {}),
            },
            include: {
                taxProfile: { select: { gstin: true, gstnVerified: true, gstnStatus: true } },
                paymentPolicy: { select: { holdPayment: true, creditDays: true } },
                openingBalances: { orderBy: { createdAt: 'desc' }, take: 1 },
                contacts: { where: { isPrimary: true }, take: 1 },
            },
            orderBy: { name: 'asc' },
        });
    }
    async createLedger(storeId, data) {
        if (!data.name)
            throw new common_1.BadRequestException('Ledger Name is required');
        if (!data.contact?.mobile)
            throw new common_1.BadRequestException('Mobile number is required');
        return this.prisma.$transaction(async (tx) => {
            const ledger = await tx.partyLedger.create({
                data: {
                    storeId,
                    name: data.name.trim(),
                    legacyCode: data.legacyCode,
                    station: data.station,
                    accountGroup: data.accountGroup ?? 'SUNDRY CREDITORS',
                    balancingMethod: data.balancingMethod ?? 'Bill by Bill',
                    ledgerType: data.ledgerType ?? 'REGISTERED',
                    category: data.category ?? 'OTHERS',
                    ledgerDate: data.ledgerDate ? new Date(data.ledgerDate) : null,
                    freezeUpto: data.freezeUpto ? new Date(data.freezeUpto) : null,
                    isHidden: data.isHidden ?? false,
                    erpToErpEnabled: data.erpToErpEnabled ?? false,
                    colorType: data.colorType,
                    billImportSource: data.billImportSource,
                },
            });
            if (data.openingBalance) {
                await tx.ledgerOpeningBalance.create({
                    data: {
                        partyLedgerId: ledger.id,
                        financialYear: data.openingBalance.financialYear,
                        amount: new library_1.Decimal(data.openingBalance.amount ?? 0),
                        balanceType: data.openingBalance.balanceType ?? 'CR',
                        asOfDate: data.openingBalance.asOfDate ? new Date(data.openingBalance.asOfDate) : null,
                    },
                });
            }
            await tx.supplierContact.create({
                data: {
                    partyLedgerId: ledger.id,
                    name: data.contact?.contactPerson,
                    designation: data.contact?.designation,
                    mobile: data.contact?.mobile,
                    officePhone: data.contact?.phoneOff,
                    residencePhone: data.contact?.phoneRes,
                    fax: data.contact?.fax,
                    email: data.contact?.email,
                    website: data.contact?.website,
                    mailToName: data.name.trim(),
                    isPrimary: true,
                },
            });
            if (data.address) {
                await tx.supplierAddress.create({
                    data: {
                        partyLedgerId: ledger.id,
                        addressType: 'BILLING',
                        addressLine1: data.address.addressLine1,
                        addressLine2: data.address.addressLine2,
                        city: data.address.city,
                        station: data.station,
                        district: data.address.district,
                        stateCode: data.address.stateCode,
                        stateName: data.address.stateName,
                        pinCode: data.address.pinCode,
                        country: data.address.country ?? 'INDIA',
                        isDefaultBilling: true,
                    },
                });
            }
            if (data.tax) {
                await tx.supplierTaxProfile.create({
                    data: {
                        partyLedgerId: ledger.id,
                        gstHeading: data.tax.gstHeading,
                        gstin: data.tax.gstin,
                        gstRegistrationType: data.tax.gstRegistrationType ?? data.ledgerType,
                        pan: data.tax.pan,
                        tinNumber: data.tax.tinNumber,
                        vatNumber: data.tax.vatNumber,
                        serviceTaxNumber: data.tax.serviceTaxNumber,
                        foodLicenseNumber: data.tax.foodLicenseNumber,
                        extraRegistrationNumber: data.tax.extraRegistrationNumber,
                        registrationNumber: data.tax.registrationNumber,
                        stateCode: data.address?.stateCode,
                        country: data.address?.country ?? 'INDIA',
                    },
                });
            }
            if (data.paymentPolicy) {
                await tx.supplierPaymentPolicy.create({
                    data: {
                        partyLedgerId: ledger.id,
                        holdPayment: data.paymentPolicy.holdPayment ?? false,
                        holdPaymentReason: data.paymentPolicy.holdPaymentReason,
                        holdPaymentPercent: data.paymentPolicy.holdPaymentPercent != null
                            ? new library_1.Decimal(data.paymentPolicy.holdPaymentPercent) : null,
                        creditLimit: data.paymentPolicy.creditLimit != null
                            ? new library_1.Decimal(data.paymentPolicy.creditLimit) : null,
                        creditDays: data.paymentPolicy.creditDays,
                        paymentTerms: data.paymentPolicy.paymentTerms,
                        defaultPaymentMode: data.paymentPolicy.defaultPaymentMode,
                        gstr1ComplianceRequired: data.paymentPolicy.gstr1ComplianceRequired ?? false,
                    },
                });
            }
            return ledger;
        });
    }
    async updateLedger(partyLedgerId, storeId, data) {
        return this.prisma.$transaction(async (tx) => {
            const ledger = await tx.partyLedger.findFirst({ where: { id: partyLedgerId, storeId } });
            if (!ledger)
                throw new common_1.NotFoundException('Party Ledger not found or access denied');
            if (data.ledger) {
                await tx.partyLedger.update({
                    where: { id: partyLedgerId },
                    data: {
                        name: data.ledger.name,
                        station: data.ledger.station,
                        accountGroup: data.ledger.accountGroup,
                        balancingMethod: data.ledger.balancingMethod,
                        ledgerType: data.ledger.ledgerType,
                        category: data.ledger.category,
                        isHidden: data.ledger.isHidden,
                        colorType: data.ledger.colorType,
                        freezeUpto: data.ledger.freezeUpto ? new Date(data.ledger.freezeUpto) : undefined,
                        erpToErpEnabled: data.ledger.erpToErpEnabled,
                    },
                });
            }
            if (data.contact) {
                const existing = await tx.supplierContact.findFirst({ where: { partyLedgerId, isPrimary: true } });
                if (existing) {
                    await tx.supplierContact.update({
                        where: { id: existing.id },
                        data: {
                            name: data.contact.contactPerson,
                            designation: data.contact.designation,
                            mobile: data.contact.mobile,
                            officePhone: data.contact.phoneOff,
                            residencePhone: data.contact.phoneRes,
                            fax: data.contact.fax,
                            email: data.contact.email,
                            website: data.contact.website,
                        },
                    });
                }
                else {
                    await tx.supplierContact.create({
                        data: { partyLedgerId, ...data.contact, isPrimary: true },
                    });
                }
            }
            if (data.address) {
                const existing = await tx.supplierAddress.findFirst({ where: { partyLedgerId, isDefaultBilling: true } });
                if (existing) {
                    await tx.supplierAddress.update({
                        where: { id: existing.id },
                        data: {
                            addressLine1: data.address.addressLine1,
                            addressLine2: data.address.addressLine2,
                            city: data.address.city,
                            district: data.address.district,
                            stateCode: data.address.stateCode,
                            stateName: data.address.stateName,
                            pinCode: data.address.pinCode,
                            country: data.address.country,
                        },
                    });
                }
            }
            if (data.tax) {
                await tx.supplierTaxProfile.upsert({
                    where: { partyLedgerId },
                    create: { partyLedgerId, ...data.tax },
                    update: data.tax,
                });
            }
            if (data.paymentPolicy) {
                const pp = {
                    holdPayment: data.paymentPolicy.holdPayment,
                    holdPaymentReason: data.paymentPolicy.holdPaymentReason,
                    holdPaymentPercent: data.paymentPolicy.holdPaymentPercent != null
                        ? new library_1.Decimal(data.paymentPolicy.holdPaymentPercent) : undefined,
                    creditLimit: data.paymentPolicy.creditLimit != null
                        ? new library_1.Decimal(data.paymentPolicy.creditLimit) : undefined,
                    creditDays: data.paymentPolicy.creditDays,
                    paymentTerms: data.paymentPolicy.paymentTerms,
                    gstr1ComplianceRequired: data.paymentPolicy.gstr1ComplianceRequired,
                };
                await tx.supplierPaymentPolicy.upsert({
                    where: { partyLedgerId },
                    create: { partyLedgerId, ...pp },
                    update: pp,
                });
            }
            return this.getLedgerView(partyLedgerId);
        });
    }
    async getAllSuppliers() {
        return this.prisma.supplier.findMany({
            include: { storeConnections: true },
            orderBy: { name: 'asc' },
        });
    }
    async getStoreConnections(storeId) {
        return this.prisma.storeSupplierConnection.findMany({
            where: { storeId },
            include: { supplier: true },
        });
    }
    async connectStoreToSupplier(storeId, supplierId) {
        const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        const existing = await this.prisma.storeSupplierConnection.findUnique({
            where: { storeId_supplierId: { storeId, supplierId } },
        });
        if (existing)
            return existing;
        return this.prisma.storeSupplierConnection.create({
            data: { storeId, supplierId, status: 'PENDING' },
        });
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map