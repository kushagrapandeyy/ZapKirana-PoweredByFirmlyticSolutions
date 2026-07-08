import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * SuppliersService — PartyLedger-first architecture.
 * PartyLedger is the primary entity. Supplier is the compatibility/procurement layer.
 * All UI entry points create/edit a PartyLedger and fan out to sub-tables transactionally.
 */

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // PARTY LEDGER — COMPOSED VIEW
  // =====================================================

  /**
   * Returns a full SupplierLedgerView — all sub-tables in one call.
   * The UI has one clean object. No waterfall fetches.
   */
  async getLedgerView(partyLedgerId: string) {
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
    if (!ledger) throw new NotFoundException(`PartyLedger ${partyLedgerId} not found`);
    return ledger;
  }

  /**
   * List all party ledgers for a store (suppliers + creditors)
   */
  async listLedgers(storeId: string, opts?: { accountGroup?: string }) {
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

  // =====================================================
  // CREATE LEDGER (PartyLedger-first)
  // =====================================================

  async createLedger(storeId: string, data: CreateLedgerPayload) {
    if (!data.name) throw new BadRequestException('Ledger Name is required');
    if (!data.contact?.mobile) throw new BadRequestException('Mobile number is required');

    return this.prisma.$transaction(async (tx) => {
      // 1. Create PartyLedger
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

      // 2. Opening Balance
      if (data.openingBalance) {
        await tx.ledgerOpeningBalance.create({
          data: {
            partyLedgerId: ledger.id,
            financialYear: data.openingBalance.financialYear,
            amount: new Decimal(data.openingBalance.amount ?? 0),
            balanceType: data.openingBalance.balanceType ?? 'CR',
            asOfDate: data.openingBalance.asOfDate ? new Date(data.openingBalance.asOfDate) : null,
          },
        });
      }

      // 3. Primary Contact (mobile is compulsory)
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

      // 4. Primary Address
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

      // 5. Tax Profile
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

      // 6. Payment Policy
      if (data.paymentPolicy) {
        await tx.supplierPaymentPolicy.create({
          data: {
            partyLedgerId: ledger.id,
            holdPayment: data.paymentPolicy.holdPayment ?? false,
            holdPaymentReason: data.paymentPolicy.holdPaymentReason,
            holdPaymentPercent: data.paymentPolicy.holdPaymentPercent != null
              ? new Decimal(data.paymentPolicy.holdPaymentPercent) : null,
            creditLimit: data.paymentPolicy.creditLimit != null
              ? new Decimal(data.paymentPolicy.creditLimit) : null,
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

  // =====================================================
  // UPDATE LEDGER — fan-out upsert across all sub-tables
  // =====================================================

  async updateLedger(partyLedgerId: string, storeId: string, data: UpdateLedgerPayload) {
    return this.prisma.$transaction(async (tx) => {
      // Verify ownership
      const ledger = await tx.partyLedger.findFirst({ where: { id: partyLedgerId, storeId } });
      if (!ledger) throw new NotFoundException('Party Ledger not found or access denied');

      // 1. Update PartyLedger core
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

      // 2. Upsert primary contact
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
        } else {
          await tx.supplierContact.create({
            data: { partyLedgerId, ...data.contact, isPrimary: true },
          });
        }
      }

      // 3. Upsert billing address
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

      // 4. Upsert tax profile
      if (data.tax) {
        await tx.supplierTaxProfile.upsert({
          where: { partyLedgerId },
          create: { partyLedgerId, ...data.tax },
          update: data.tax,
        });
      }

      // 5. Upsert payment policy
      if (data.paymentPolicy) {
        const pp = {
          holdPayment: data.paymentPolicy.holdPayment,
          holdPaymentReason: data.paymentPolicy.holdPaymentReason,
          holdPaymentPercent: data.paymentPolicy.holdPaymentPercent != null
            ? new Decimal(data.paymentPolicy.holdPaymentPercent) : undefined,
          creditLimit: data.paymentPolicy.creditLimit != null
            ? new Decimal(data.paymentPolicy.creditLimit) : undefined,
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

  // =====================================================
  // LEGACY — kept for backward compat
  // =====================================================

  async getAllSuppliers() {
    return this.prisma.supplier.findMany({
      include: { storeConnections: true },
      orderBy: { name: 'asc' },
    });
  }

  async getStoreConnections(storeId: string) {
    return this.prisma.storeSupplierConnection.findMany({
      where: { storeId },
      include: { supplier: true },
    });
  }

  async connectStoreToSupplier(storeId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const existing = await this.prisma.storeSupplierConnection.findUnique({
      where: { storeId_supplierId: { storeId, supplierId } },
    });
    if (existing) return existing;

    return this.prisma.storeSupplierConnection.create({
      data: { storeId, supplierId, status: 'PENDING' },
    });
  }
}

// =====================================================
// PAYLOAD TYPES
// =====================================================

export interface CreateLedgerPayload {
  name: string;
  legacyCode?: string;
  station?: string;
  accountGroup?: string;
  balancingMethod?: string;
  ledgerType?: string;
  category?: string;
  ledgerDate?: string;
  freezeUpto?: string;
  isHidden?: boolean;
  erpToErpEnabled?: boolean;
  colorType?: string;
  billImportSource?: string;

  openingBalance?: {
    financialYear?: string;
    amount?: number;
    balanceType?: string;
    asOfDate?: string;
  };

  contact?: {
    mobile: string;
    contactPerson?: string;
    designation?: string;
    phoneOff?: string;
    phoneRes?: string;
    fax?: string;
    email?: string;
    website?: string;
  };

  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    stateCode?: string;
    stateName?: string;
    pinCode?: string;
    country?: string;
  };

  tax?: {
    gstHeading?: string;
    gstin?: string;
    gstRegistrationType?: string;
    pan?: string;
    tinNumber?: string;
    vatNumber?: string;
    serviceTaxNumber?: string;
    foodLicenseNumber?: string;
    extraRegistrationNumber?: string;
    registrationNumber?: string;
  };

  paymentPolicy?: {
    holdPayment?: boolean;
    holdPaymentReason?: string;
    holdPaymentPercent?: number;
    creditLimit?: number;
    creditDays?: number;
    paymentTerms?: string;
    defaultPaymentMode?: string;
    gstr1ComplianceRequired?: boolean;
  };
}

export type UpdateLedgerPayload = Partial<{
  ledger: Partial<{
    name: string;
    station: string;
    accountGroup: string;
    balancingMethod: string;
    ledgerType: string;
    category: string;
    isHidden: boolean;
    colorType: string;
    freezeUpto: string;
    erpToErpEnabled: boolean;
  }>;
  contact: Partial<CreateLedgerPayload['contact']>;
  address: Partial<CreateLedgerPayload['address']>;
  tax: Partial<CreateLedgerPayload['tax']>;
  paymentPolicy: Partial<CreateLedgerPayload['paymentPolicy']>;
}>;
