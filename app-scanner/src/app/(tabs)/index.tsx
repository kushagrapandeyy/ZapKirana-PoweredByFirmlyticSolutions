/**
 * Scanner Home — Mode Picker
 *
 * This screen shows when mode = IDLE.
 * The user selects a mode, optionally links a PO, then enters scan.tsx.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useScannerStore, type ScannerMode } from '../../store/useScannerStore';
import { API_BASE_URL } from '../../constants/api';

const T = {
  bg: '#0A0A0A', surface: '#141414', card: '#1C1C1E', cardBorder: '#2C2C2E',
  amber: '#F59E0B', green: '#22C55E', red: '#EF4444', white: '#FFFFFF',
  grey: '#8E8E93', dimGrey: '#48484A', blue: '#3B82F6', purple: '#8B5CF6',
};

interface ModeDefinition {
  mode: ScannerMode;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresPO?: boolean;
}

const MODES: ModeDefinition[] = [
  {
    mode: 'RECEIVING',
    label: 'Goods Receiving (GRN)',
    description: 'Receive stock against a Purchase Order. Scan items to confirm quantities.',
    icon: 'package-variant-closed',
    color: T.green,
    requiresPO: true,
  },
  {
    mode: 'AUDIT',
    label: 'Stock Audit',
    description: 'Cycle count an aisle or section. Variances are flagged for approval.',
    icon: 'clipboard-check-outline',
    color: T.amber,
  },
  {
    mode: 'TRANSFER',
    label: 'Stock Transfer',
    description: 'Move stock between locations or sections within the store.',
    icon: 'swap-horizontal',
    color: T.blue,
  },
  {
    mode: 'SALES_OUT',
    label: 'Offline Sales',
    description: 'Log sales manually when POS is unavailable. Syncs when online.',
    icon: 'cart-outline',
    color: T.purple,
  },
];

interface OpenPO {
  id: string;
  poNumber: string;
  supplierName: string;
  itemCount: number;
  expectedDate: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { token, storeId, staffId } = useAuthStore();
  const { mode, session, startSession, endSession, items } = useScannerStore();

  const [openPOs, setOpenPOs] = useState<OpenPO[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeDefinition | null>(null);
  const [selectedPO, setSelectedPO] = useState<OpenPO | null>(null);
  const [starting, setStarting] = useState(false);

  // If a session is already active, show resume card
  const hasActiveSession = mode !== 'IDLE' && session != null;

  useEffect(() => {
    if (!storeId || !token) return;
    setLoadingPOs(true);
    fetch(`${API_BASE_URL}/procurement/pos?storeId=${storeId}&status=APPROVED`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        setOpenPOs(
          (data ?? []).map((po) => ({
            id: po.id,
            poNumber: po.poNumber,
            supplierName: po.supplier?.name ?? po.supplierName ?? '—',
            itemCount: po.items?.length ?? 0,
            expectedDate: po.expectedDeliveryDate ?? '',
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingPOs(false));
  }, [storeId, token]);

  const handleStart = async () => {
    if (!selectedMode) return;
    if (selectedMode.requiresPO && !selectedPO) {
      Alert.alert('Select a PO', 'Please select an open Purchase Order to start receiving.');
      return;
    }
    if (!storeId) {
      Alert.alert('Not logged in', 'Please log in first.');
      return;
    }
    setStarting(true);
    try {
      await startSession({
        storeId,
        mode: selectedMode.mode,
        poId: selectedPO?.id,
        poNumber: selectedPO?.poNumber,
      });
      router.push('/(tabs)/scanner');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Basko Scanner</Text>
          <Text style={s.headerSub}>{storeId ? `Store session active` : 'Not logged in'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={s.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={T.grey} />
        </TouchableOpacity>
      </View>

      {/* ── Active Session Banner ────────────────────────────────────── */}
      {hasActiveSession && (
        <View style={s.activeBanner}>
          <View>
            <Text style={s.activeBannerTitle}>Session Active · {mode}</Text>
            <Text style={s.activeBannerSub}>{items.length} items scanned{session?.poNumber ? ` · PO ${session.poNumber}` : ''}</Text>
          </View>
          <View style={s.activeBannerActions}>
            <TouchableOpacity style={s.resumeBtn} onPress={() => router.push('/(tabs)/scanner')}>
              <Text style={s.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.endBtn} onPress={() => {
              Alert.alert('End Session', 'Are you sure? All unsynced data will be queued.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'End Session', style: 'destructive', onPress: endSession },
              ]);
            }}>
              <Text style={s.endBtnText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={[1]}
        keyExtractor={() => 'content'}
        renderItem={() => (
          <View style={{ gap: 20, padding: 16 }}>

            {/* ── Mode Selection ───────────────────────────────────── */}
            <Text style={s.sectionLabel}>SELECT MODE</Text>
            {MODES.map((m) => (
              <TouchableOpacity
                key={m.mode}
                style={[s.modeCard, selectedMode?.mode === m.mode && { borderColor: m.color, borderWidth: 2 }]}
                onPress={() => { setSelectedMode(m); setSelectedPO(null); }}
                activeOpacity={0.7}
              >
                <View style={[s.modeIcon, { backgroundColor: `${m.color}22` }]}>
                  <MaterialCommunityIcons name={m.icon as any} size={28} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.modeLabel}>{m.label}</Text>
                  <Text style={s.modeDesc}>{m.description}</Text>
                </View>
                {selectedMode?.mode === m.mode && (
                  <Ionicons name="checkmark-circle" size={22} color={m.color} />
                )}
              </TouchableOpacity>
            ))}

            {/* ── PO Selection (RECEIVING only) ────────────────────── */}
            {selectedMode?.requiresPO && (
              <>
                <Text style={s.sectionLabel}>SELECT PURCHASE ORDER</Text>
                {loadingPOs ? (
                  <ActivityIndicator color={T.amber} />
                ) : openPOs.length === 0 ? (
                  <View style={s.emptyPOCard}>
                    <Text style={s.emptyPOText}>No open Purchase Orders found.</Text>
                    <Text style={s.emptyPOSub}>Create a PO in the Vendor App first.</Text>
                  </View>
                ) : (
                  openPOs.map((po) => (
                    <TouchableOpacity
                      key={po.id}
                      style={[s.poCard, selectedPO?.id === po.id && { borderColor: T.green, borderWidth: 2 }]}
                      onPress={() => setSelectedPO(po)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.poNumber}>{po.poNumber}</Text>
                        <Text style={s.poSub}>{po.supplierName} · {po.itemCount} items</Text>
                      </View>
                      {selectedPO?.id === po.id && (
                        <Ionicons name="checkmark-circle" size={22} color={T.green} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {/* ── Start Button ─────────────────────────────────────── */}
            {selectedMode && (
              <TouchableOpacity
                style={[s.startBtn, { backgroundColor: selectedMode.color }]}
                onPress={handleStart}
                disabled={starting}
              >
                {starting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={s.startBtnText}>START {selectedMode.label.toUpperCase()}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.cardBorder },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T.white },
  headerSub: { fontSize: 12, color: T.grey, marginTop: 2 },
  settingsBtn: { padding: 8 },

  activeBanner: { backgroundColor: '#1A2A1A', borderLeftWidth: 3, borderLeftColor: T.green, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBannerTitle: { fontSize: 14, fontWeight: '700', color: T.green },
  activeBannerSub: { fontSize: 12, color: T.grey },
  activeBannerActions: { flexDirection: 'row', gap: 8 },
  resumeBtn: { backgroundColor: T.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  resumeBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  endBtn: { backgroundColor: T.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: T.red },
  endBtnText: { fontSize: 13, fontWeight: '700', color: T.red },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: T.dimGrey, letterSpacing: 1.5 },
  modeCard: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.cardBorder, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  modeIcon: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modeLabel: { fontSize: 16, fontWeight: '700', color: T.white, marginBottom: 4 },
  modeDesc: { fontSize: 12, color: T.grey, lineHeight: 18 },

  poCard: { backgroundColor: T.card, borderRadius: 10, borderWidth: 1, borderColor: T.cardBorder, padding: 14, flexDirection: 'row', alignItems: 'center' },
  poNumber: { fontSize: 15, fontWeight: '700', color: T.white },
  poSub: { fontSize: 12, color: T.grey, marginTop: 2 },
  emptyPOCard: { backgroundColor: T.card, borderRadius: 10, padding: 20, alignItems: 'center', gap: 6 },
  emptyPOText: { fontSize: 14, fontWeight: '600', color: T.grey },
  emptyPOSub: { fontSize: 12, color: T.dimGrey },

  startBtn: { borderRadius: 12, padding: 18, alignItems: 'center' },
  startBtnText: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
});
