/**
 * Primary Scan Screen
 *
 * This is THE core screen of the scanner app.
 * It is always visible when a mode is active.
 *
 * Layout:
 *   ┌─────────────────────────────────┐
 *   │ [MODE]  RECEIVING  ● SYNCED     │  Persistent header
 *   │ Store: Basko CP | PO #240701    │
 *   ├─────────────────────────────────┤
 *   │                                 │
 *   │   AMUL TAAZA 1L                 │  Product card (center)
 *   │   Brand: AMUL                   │  Large text for arm-length read
 *   │   MRP: ₹68  Cost: ₹52           │
 *   │   ERP: 24   Scanned: +6         │
 *   │   ⚠ Expiry: DEC 2025           │
 *   │                                 │
 *   ├─────────────────────────────────┤
 *   │  Camera viewfinder (fallback)   │
 *   │                                 │
 *   ├─────────────────────────────────┤
 *   │ [ -1 ]  [ EDIT QTY ]  [ +1 ]   │  Thumb-reach action matrix
 *   │ [    CONFIRM / ADD ITEM    ]    │
 *   │ [    FLAG / SKIP           ]    │
 *   └─────────────────────────────────┘
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Vibration, ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/useAuthStore';
import { useScannerStore, type ScannedItem } from '../../store/useScannerStore';
import { resolveBarcode, type ProductMaster } from '../../services/dataKart';
import { useDataWedge } from '../../hooks/useDataWedge';

// ── Zebra dark theme ────────────────────────────────────────────────────────
const T = {
  bg: '#0A0A0A',
  surface: '#141414',
  card: '#1C1C1E',
  cardBorder: '#2C2C2E',
  amber: '#F59E0B',
  green: '#22C55E',
  red: '#EF4444',
  white: '#FFFFFF',
  grey: '#8E8E93',
  dimGrey: '#48484A',
  blue: '#3B82F6',
};

// ── Feedback helpers ────────────────────────────────────────────────────────

async function beepSuccess() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

async function beepUnknown() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  // DataWedge hardware beep pattern is configured in the profile
}

async function beepExpiry() {
  Vibration.vibrate([0, 200, 100, 200]);
}

// ── Mode badge ──────────────────────────────────────────────────────────────

const MODE_LABELS: Record<string, string> = {
  IDLE: 'IDLE',
  RECEIVING: 'GRN · RECEIVING',
  AUDIT: 'STOCK AUDIT',
  TRANSFER: 'TRANSFER',
  SALES_OUT: 'SALES OUT',
};

// ── Product Card ────────────────────────────────────────────────────────────

const ProductCard = ({ item }: { item: ScannedItem | null; loading: boolean }) => {
  if (!item) {
    return (
      <View style={styles.productCardEmpty}>
        <MaterialCommunityIcons name="barcode-scan" size={56} color={T.dimGrey} />
        <Text style={styles.emptyText}>Scan a barcode to begin</Text>
      </View>
    );
  }

  const hasVariance = item.variance != null && item.variance !== 0;
  const varianceColor = (item.variance ?? 0) < 0 ? T.red : T.green;

  return (
    <View style={[styles.productCard, item.expiryWarning === 'critical' && styles.productCardDanger, item.expiryWarning === 'warning' && styles.productCardWarning]}>
      {/* Product name — large for arm-length read */}
      <Text style={styles.productName} numberOfLines={2}>{item.product.name || '—'}</Text>
      {item.product.brand && <Text style={styles.productBrand}>{item.product.brand.toUpperCase()}</Text>}
      {item.product.packagingType && <Text style={styles.productSub}>{item.product.packagingType}{item.product.netWeight ? ` · ${item.product.netWeight}` : ''}</Text>}

      <View style={styles.priceRow}>
        {item.product.mrp != null && (
          <View style={styles.priceChip}>
            <Text style={styles.priceLabel}>MRP</Text>
            <Text style={styles.priceValue}>₹{item.product.mrp}</Text>
          </View>
        )}
        {item.costPrice != null && (
          <View style={styles.priceChip}>
            <Text style={styles.priceLabel}>COST</Text>
            <Text style={styles.priceValue}>₹{item.costPrice}</Text>
          </View>
        )}
        {item.product.gstRate != null && (
          <View style={styles.priceChip}>
            <Text style={styles.priceLabel}>GST</Text>
            <Text style={styles.priceValue}>{item.product.gstRate}%</Text>
          </View>
        )}
      </View>

      <View style={styles.stockRow}>
        {item.erpStock != null && (
          <Text style={styles.stockText}>ERP: <Text style={styles.stockVal}>{item.erpStock}</Text></Text>
        )}
        <Text style={styles.stockText}>Scanned: <Text style={[styles.stockVal, { color: T.amber }]}>{item.qty}</Text></Text>
        {hasVariance && (
          <Text style={[styles.stockText, { color: varianceColor }]}>
            Δ {(item.variance ?? 0) > 0 ? '+' : ''}{item.variance}
          </Text>
        )}
      </View>

      {item.expiryWarning && (
        <View style={[styles.expiryBanner, item.expiryWarning === 'critical' ? styles.expiryBannerCritical : styles.expiryBannerWarning]}>
          <Ionicons name="warning" size={16} color={item.expiryWarning === 'critical' ? T.red : T.amber} />
          <Text style={[styles.expiryText, { color: item.expiryWarning === 'critical' ? T.red : T.amber }]}>
            {item.expiryWarning === 'critical' ? 'EXPIRING CRITICALLY — Move off shelf' : `Expiry: ${item.expiryDate} — Move to front`}
          </Text>
        </View>
      )}

      {item.product.fssaiNumber && (
        <Text style={styles.fssaiText}>FSSAI: {item.product.fssaiNumber}</Text>
      )}
    </View>
  );
};

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const { token, storeId } = useAuthStore();
  const { mode, session, items, isOnline, addScan, updateQty, removeScan } = useScannerStore();

  const [lastScanned, setLastScanned] = useState<ScannedItem | null>(null);
  const [resolving, setResolving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBarcodeRef = useRef<string | null>(null);

  // The last scanned item is shown as the active card
  useEffect(() => {
    if (items.length > 0) {
      setLastScanned(items[items.length - 1]);
    }
  }, [items]);

  const handleBarcode = useCallback(async (barcode: string) => {
    if (!storeId || !session) return;

    // Deduplicate rapid-fire scans (DataWedge can fire 2–3 times per pull)
    if (lastBarcodeRef.current === barcode) return;
    lastBarcodeRef.current = barcode;
    setTimeout(() => { lastBarcodeRef.current = null; }, 500);

    setResolving(true);
    try {
      const product = await resolveBarcode(barcode, storeId, token ?? '');

      if (product.source === 'unknown') {
        await beepUnknown();
        Alert.alert(
          'Unknown Barcode',
          `${barcode}\n\nProduct not found in DataKart or local database.\n\nEnter details manually?`,
          [
            { text: 'Skip', style: 'cancel' },
            { text: 'Enter Manually', onPress: () => setShowCamera(false) },
          ],
        );
        return;
      }

      if (product.source === 'datakart' || product.source === 'openfoodfacts') {
        // New product — user must confirm before it enters the ERP
        // (handled by parent navigation to product-confirm modal)
      }

      await addScan({ storeId, barcode, product });

      // Expiry feedback
      const item = useScannerStore.getState().items.find((i) => i.barcode === barcode);
      if (item?.expiryWarning === 'critical') {
        await beepExpiry();
      } else {
        await beepSuccess();
      }
    } catch (e) {
      console.error('[ScanScreen] handleBarcode error:', e);
    } finally {
      setResolving(false);
    }
  }, [storeId, session, token, addScan]);

  // DataWedge — hardware trigger (Zebra)
  useDataWedge(
    (event) => handleBarcode(event.barcode),
    mode !== 'IDLE',
  );

  // Camera fallback — non-Zebra devices
  const handleCameraScan = useCallback(({ data }: { data: string }) => {
    if (debounceRef.current) return;
    debounceRef.current = setTimeout(() => { debounceRef.current = null; }, 1200);
    handleBarcode(data);
  }, [handleBarcode]);

  if (mode === 'IDLE') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.idleContainer}>
          <MaterialCommunityIcons name="barcode-scan" size={80} color={T.dimGrey} />
          <Text style={styles.idleTitle}>No Active Session</Text>
          <Text style={styles.idleSub}>Select a mode from the home screen to start scanning.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{MODE_LABELS[mode] ?? mode}</Text>
          </View>
          {session?.poNumber && (
            <Text style={styles.headerSub}>PO {session.poNumber}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? T.green : T.amber }]} />
          <Text style={[styles.onlineText, { color: isOnline ? T.green : T.amber }]}>
            {isOnline ? 'SYNCED' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* ── Product Card ─────────────────────────────────────────────── */}
      <View style={styles.cardArea}>
        {resolving ? (
          <View style={styles.productCardEmpty}>
            <ActivityIndicator size="large" color={T.amber} />
            <Text style={styles.emptyText}>Resolving barcode...</Text>
          </View>
        ) : (
          <ProductCard item={lastScanned} loading={resolving} />
        )}
      </View>

      {/* ── Camera (non-Zebra fallback) ──────────────────────────────── */}
      {Platform.OS !== 'android' || showCamera ? (
        <View style={styles.cameraBox}>
          {!permission?.granted ? (
            <TouchableOpacity style={styles.cameraPermBtn} onPress={requestPermission}>
              <Text style={styles.cameraPermText}>Allow Camera</Text>
            </TouchableOpacity>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'qr', 'pdf417'] }}
              onBarcodeScanned={handleCameraScan}
            />
          )}
        </View>
      ) : null}

      {/* ── Action Matrix (thumb zone) ───────────────────────────────── */}
      {lastScanned && (
        <View style={styles.actionMatrix}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => updateQty(lastScanned.barcode, -1)}>
              <Text style={styles.actionBtnText}>−1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => {
              Alert.prompt('Edit Qty', `Current: ${lastScanned.qty}`, (v) => {
                const n = Number(v);
                if (!isNaN(n) && n >= 0) updateQty(lastScanned.barcode, n - lastScanned.qty);
              }, 'plain-text', String(lastScanned.qty), 'numeric');
            }}>
              <Text style={styles.actionBtnText}>EDIT QTY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => updateQty(lastScanned.barcode, 1)}>
              <Text style={styles.actionBtnText}>+1</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnConfirm]}>
            <Text style={styles.actionBtnConfirmText}>CONFIRM ITEM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnFlag]} onPress={() => {
            Alert.alert('Flag or Skip', '', [
              { text: 'Skip Item', style: 'destructive', onPress: () => { removeScan(lastScanned.barcode); setLastScanned(null); } },
              { text: 'Flag for Review', onPress: () => {} },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}>
            <Text style={styles.actionBtnFlagText}>⚑  FLAG / SKIP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Item Counter ─────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{items.length} item{items.length !== 1 ? 's' : ''} scanned this session</Text>
        {!showCamera && Platform.OS !== 'android' && (
          <TouchableOpacity onPress={() => setShowCamera(true)}>
            <Text style={styles.cameraToggle}>📷 Use Camera</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.cardBorder },
  headerLeft: { gap: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeBadge: { backgroundColor: T.amber, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  modeBadgeText: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: 1 },
  headerSub: { fontSize: 12, color: T.grey },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 12, fontWeight: '700' },

  // Product card
  cardArea: { flex: 1, padding: 12, justifyContent: 'center' },
  productCardEmpty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyText: { fontSize: 16, color: T.dimGrey, textAlign: 'center' },
  productCard: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.cardBorder, padding: 18, gap: 10 },
  productCardDanger: { borderColor: T.red, borderWidth: 2 },
  productCardWarning: { borderColor: T.amber, borderWidth: 2 },
  productName: { fontSize: 26, fontWeight: '800', color: T.white, lineHeight: 32 },
  productBrand: { fontSize: 13, fontWeight: '700', color: T.amber, letterSpacing: 1 },
  productSub: { fontSize: 13, color: T.grey },
  priceRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  priceChip: { backgroundColor: '#2A2A2A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  priceLabel: { fontSize: 10, color: T.grey, fontWeight: '700' },
  priceValue: { fontSize: 16, fontWeight: '800', color: T.white },
  stockRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  stockText: { fontSize: 14, color: T.grey },
  stockVal: { fontWeight: '800', color: T.white },
  expiryBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 6 },
  expiryBannerCritical: { backgroundColor: 'rgba(239,68,68,0.15)' },
  expiryBannerWarning: { backgroundColor: 'rgba(245,158,11,0.15)' },
  expiryText: { fontSize: 13, fontWeight: '700', flex: 1 },
  fssaiText: { fontSize: 11, color: T.dimGrey },

  // Camera
  cameraBox: { height: 140, margin: 12, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  cameraPermBtn: { padding: 12 },
  cameraPermText: { color: T.amber, fontSize: 14, fontWeight: '700' },

  // Action matrix
  actionMatrix: { paddingHorizontal: 12, paddingBottom: 4, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  actionBtnSecondary: { flex: 1, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder },
  actionBtnPrimary: { flex: 1, backgroundColor: T.green },
  actionBtnConfirm: { backgroundColor: T.blue, paddingVertical: 16 },
  actionBtnFlag: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.dimGrey, paddingVertical: 12 },
  actionBtnText: { fontSize: 18, fontWeight: '800', color: T.white },
  actionBtnConfirmText: { fontSize: 16, fontWeight: '800', color: T.white, letterSpacing: 1 },
  actionBtnFlagText: { fontSize: 14, fontWeight: '700', color: T.grey },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.cardBorder },
  footerText: { fontSize: 12, color: T.grey },
  cameraToggle: { fontSize: 12, color: T.amber },

  // Idle
  idleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40 },
  idleTitle: { fontSize: 22, fontWeight: '800', color: T.grey },
  idleSub: { fontSize: 14, color: T.dimGrey, textAlign: 'center', lineHeight: 22 },
});
