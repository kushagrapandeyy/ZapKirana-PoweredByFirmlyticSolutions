/**
 * Scanner Mode State Machine (Zustand)
 *
 * Modes:
 *   IDLE        — No active operation. Show mode picker.
 *   RECEIVING   — GRN / Goods Receiving linked to a Purchase Order
 *   AUDIT       — Stock cycle count (blind or semi-blind)
 *   TRANSFER    — Inter-location stock transfer
 *   SALES_OUT   — Manual offline sales (no POS terminal)
 *
 * Each mode has a session object that tracks:
 *   - Which PO / aisle / etc. is active
 *   - All scanned items in-memory (persisted to SQLite asap)
 *   - Any variances (audit only)
 */

import { create } from 'zustand';
import { localCache } from '../services/localCache';
import type { ProductMaster } from '../services/dataKart';

export type ScannerMode = 'IDLE' | 'RECEIVING' | 'AUDIT' | 'TRANSFER' | 'SALES_OUT';

export interface ScannedItem {
  barcode: string;
  product: ProductMaster;
  qty: number;
  costPrice?: number;
  expiryDate?: string;
  batchNo?: string;
  erpStock?: number;       // ERP balance at time of scan (audit only)
  variance?: number;       // scanned - erpStock (audit only)
  expiryWarning?: 'critical' | 'warning' | null; // ≤7 days / ≤15 days
  scannedAt: number;
}

interface ScanSession {
  id: string;
  mode: ScannerMode;
  poId?: string;
  poNumber?: string;
  startedAt: number;
}

interface ScannerState {
  mode: ScannerMode;
  session: ScanSession | null;
  items: ScannedItem[];
  isOnline: boolean;
  lastScanAt: number | null;

  // Actions
  setMode: (mode: ScannerMode) => void;
  startSession: (params: { storeId: string; mode: ScannerMode; poId?: string; poNumber?: string }) => Promise<string>;
  endSession: () => Promise<void>;
  addScan: (params: {
    storeId: string;
    barcode: string;
    product: ProductMaster;
    qty?: number;
    costPrice?: number;
    expiryDate?: string;
    batchNo?: string;
    erpStock?: number;
  }) => Promise<void>;
  updateQty: (barcode: string, delta: number) => void;
  removeScan: (barcode: string) => void;
  setOnline: (online: boolean) => void;
  reset: () => void;
}

let sessionIdCounter = 0;

function generateSessionId(): string {
  return `session_${Date.now()}_${++sessionIdCounter}`;
}

function computeExpiryWarning(expiryDate?: string): ScannedItem['expiryWarning'] {
  if (!expiryDate) return null;
  const msUntilExpiry = new Date(expiryDate).getTime() - Date.now();
  const days = msUntilExpiry / (1000 * 60 * 60 * 24);
  if (days <= 0) return 'critical';
  if (days <= 7) return 'critical';
  if (days <= 15) return 'warning';
  return null;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  mode: 'IDLE',
  session: null,
  items: [],
  isOnline: true,
  lastScanAt: null,

  setMode: (mode) => set({ mode }),

  startSession: async ({ storeId, mode, poId, poNumber }) => {
    const id = generateSessionId();
    await localCache.createSession({ id, storeId, mode, poId });
    const session: ScanSession = { id, mode, poId, poNumber, startedAt: Date.now() };
    set({ mode, session, items: [] });
    return id;
  },

  endSession: async () => {
    const { session } = get();
    if (session) {
      await localCache.closeSession(session.id);
    }
    set({ mode: 'IDLE', session: null, items: [] });
  },

  addScan: async ({ storeId, barcode, product, qty = 1, costPrice, expiryDate, batchNo, erpStock }) => {
    const { session, items } = get();
    if (!session) return;

    const existing = items.find((i) => i.barcode === barcode);
    const expiryWarning = computeExpiryWarning(expiryDate);

    if (existing) {
      set({
        items: items.map((i) =>
          i.barcode === barcode
            ? {
                ...i,
                qty: i.qty + qty,
                variance: erpStock != null ? i.qty + qty - erpStock : i.variance,
                expiryWarning,
                scannedAt: Date.now(),
              }
            : i,
        ),
        lastScanAt: Date.now(),
      });
    } else {
      const scanId = `${session.id}_${barcode}_${Date.now()}`;
      const newItem: ScannedItem = {
        barcode,
        product,
        qty,
        costPrice,
        expiryDate,
        batchNo,
        erpStock,
        variance: erpStock != null ? qty - erpStock : undefined,
        expiryWarning,
        scannedAt: Date.now(),
      };
      set({ items: [...items, newItem], lastScanAt: Date.now() });

      // Persist to SQLite immediately (offline safety)
      await localCache.enqueueScan({
        id: scanId,
        storeId,
        sessionId: session.id,
        barcode,
        qty,
        mode: session.mode,
        costPrice,
        expiryDate,
        batchNo,
      });
    }
  },

  updateQty: (barcode, delta) => {
    const { items } = get();
    set({
      items: items.map((i) =>
        i.barcode === barcode
          ? { ...i, qty: Math.max(0, i.qty + delta), variance: i.erpStock != null ? Math.max(0, i.qty + delta) - i.erpStock : i.variance }
          : i,
      ).filter((i) => i.qty > 0),
    });
  },

  removeScan: (barcode) => {
    set({ items: get().items.filter((i) => i.barcode !== barcode) });
  },

  setOnline: (online) => set({ isOnline: online }),

  reset: () => set({ mode: 'IDLE', session: null, items: [], lastScanAt: null }),
}));
