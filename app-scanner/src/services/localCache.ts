/**
 * Local SQLite Cache (expo-sqlite)
 *
 * Stores:
 *   - products: barcode → ProductMaster (expires after 7 days)
 *   - pending_scans: scan events queued for sync
 *   - scan_sessions: GRN / audit session state
 *
 * All reads are sync-like (using the synchronous SQLite API).
 * All writes are async and non-blocking.
 */

import * as SQLite from 'expo-sqlite';
import type { ProductMaster } from './dataKart';

const DB_NAME = 'basko_scanner.db';
const PRODUCT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class LocalCacheService {
  private db: SQLite.SQLiteDatabase | null = null;

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.migrate();
    return this.db;
  }

  private async migrate() {
    const db = this.db!;
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        barcode TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        brand TEXT,
        packaging_type TEXT,
        net_weight TEXT,
        hsn_sac_code TEXT,
        gst_rate REAL,
        cgst_rate REAL,
        sgst_rate REAL,
        mrp REAL,
        fssai_number TEXT,
        image_url TEXT,
        source TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pending_scans (
        id TEXT PRIMARY KEY NOT NULL,
        store_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        barcode TEXT NOT NULL,
        qty REAL NOT NULL DEFAULT 1,
        mode TEXT NOT NULL,
        cost_price REAL,
        expiry_date TEXT,
        batch_no TEXT,
        scanned_at INTEGER NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS scan_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        store_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        po_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        started_at INTEGER NOT NULL,
        ended_at INTEGER
      );
    `);
  }

  // ── Products ─────────────────────────────────────────────────────────────

  async getProduct(barcode: string): Promise<ProductMaster | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM products WHERE barcode = ? AND cached_at > ?',
      [barcode, Date.now() - PRODUCT_TTL_MS],
    );
    if (!row) return null;
    return {
      barcode: row.barcode,
      name: row.name,
      brand: row.brand ?? undefined,
      packagingType: row.packaging_type ?? undefined,
      netWeight: row.net_weight ?? undefined,
      hsnSacCode: row.hsn_sac_code ?? undefined,
      gstRate: row.gst_rate ?? undefined,
      cgstRate: row.cgst_rate ?? undefined,
      sgstRate: row.sgst_rate ?? undefined,
      mrp: row.mrp ?? undefined,
      fssaiNumber: row.fssai_number ?? undefined,
      imageUrl: row.image_url ?? null,
      source: row.source,
    };
  }

  async saveProduct(product: ProductMaster): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO products
        (barcode, name, brand, packaging_type, net_weight, hsn_sac_code,
         gst_rate, cgst_rate, sgst_rate, mrp, fssai_number, image_url, source, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.barcode, product.name, product.brand ?? null,
        product.packagingType ?? null, product.netWeight ?? null,
        product.hsnSacCode ?? null, product.gstRate ?? null,
        product.cgstRate ?? null, product.sgstRate ?? null,
        product.mrp ?? null, product.fssaiNumber ?? null,
        product.imageUrl ?? null, product.source, Date.now(),
      ],
    );
  }

  async clearExpiredProducts(): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM products WHERE cached_at <= ?', [Date.now() - PRODUCT_TTL_MS]);
  }

  // ── Pending Scans ─────────────────────────────────────────────────────────

  async enqueueScan(scan: {
    id: string;
    storeId: string;
    sessionId: string;
    barcode: string;
    qty: number;
    mode: string;
    costPrice?: number;
    expiryDate?: string;
    batchNo?: string;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT INTO pending_scans
         (id, store_id, session_id, barcode, qty, mode, cost_price, expiry_date, batch_no, scanned_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scan.id, scan.storeId, scan.sessionId, scan.barcode,
        scan.qty, scan.mode, scan.costPrice ?? null,
        scan.expiryDate ?? null, scan.batchNo ?? null, Date.now(),
      ],
    );
  }

  async getPendingScans(sessionId: string): Promise<any[]> {
    const db = await this.getDb();
    return db.getAllAsync('SELECT * FROM pending_scans WHERE session_id = ? AND synced = 0', [sessionId]);
  }

  async markScansSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.getDb();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(`UPDATE pending_scans SET synced = 1 WHERE id IN (${placeholders})`, ids);
  }

  // ── Scan Sessions ─────────────────────────────────────────────────────────

  async createSession(session: {
    id: string;
    storeId: string;
    mode: string;
    poId?: string;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      'INSERT INTO scan_sessions (id, store_id, mode, po_id, started_at) VALUES (?, ?, ?, ?, ?)',
      [session.id, session.storeId, session.mode, session.poId ?? null, Date.now()],
    );
  }

  async closeSession(sessionId: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE scan_sessions SET status = 'closed', ended_at = ? WHERE id = ?",
      [Date.now(), sessionId],
    );
  }

  async getActiveSession(storeId: string): Promise<any | null> {
    const db = await this.getDb();
    return db.getFirstAsync(
      "SELECT * FROM scan_sessions WHERE store_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1",
      [storeId],
    );
  }
}

export const localCache = new LocalCacheService();
