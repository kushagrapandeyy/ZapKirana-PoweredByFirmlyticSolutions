import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

export default function DeviceFleetTracker() {
  const { tenantId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/scanner-management/devices?storeId=${tenantId}`, {
        headers: { 'Authorization': `Bearer DUMMY_TOKEN_FOR_NOW` }
      });
      
      if (res.ok) {
        setDevices(await res.json());
      } else {
        setDevices([
          { id: '1', deviceName: 'Warehouse Scanner 1', deviceCode: 'SCN-001', status: 'ACTIVE', lastSeenAt: new Date().toISOString() },
          { id: '2', deviceName: 'Front Desk Terminal', deviceCode: 'POS-002', status: 'ACTIVE', lastSeenAt: new Date(Date.now() - 3600000).toISOString() },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const isOnline = (lastSeenAt: string) => {
    if (!lastSeenAt) return false;
    const diffInMs = new Date().getTime() - new Date(lastSeenAt).getTime();
    return diffInMs < 60000; // Online if seen in last 60 seconds
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fleet Tracker</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Devices</Text>
            <Text style={styles.metricValue}>{devices.length}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Online Now</Text>
            <Text style={[styles.metricValue, { color: Colors.successDark }]}>
              {devices.filter(d => isOnline(d.lastSeenAt)).length}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>CONNECTED HARDWARE</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.list}>
            {devices.map((device, index) => {
              const online = isOnline(device.lastSeenAt);
              return (
                <Animated.View key={device.id} entering={FadeInDown.delay(index * 50).springify().damping(15)}>
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.deviceInfo}>
                        <View style={[styles.iconBox, { backgroundColor: online ? '#F0FDF4' : '#F1F5F9' }]}>
                          <Ionicons name="hardware-chip" size={24} color={online ? Colors.success : Colors.textMuted} />
                        </View>
                        <View>
                          <Text style={styles.deviceName}>{device.deviceName || 'Unknown Device'}</Text>
                          <Text style={styles.deviceCode}>ID: {device.deviceCode}</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.pingBtn}>
                        <Ionicons name="radio" size={16} color={online ? Colors.primary : Colors.textMuted} />
                        <Text style={[styles.pingText, { color: online ? Colors.primary : Colors.textMuted }]}>Ping</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.telemetryRow}>
                      <View style={styles.telemetryItem}>
                        <Ionicons name="battery-half" size={16} color={online ? Colors.success : Colors.textMuted} />
                        <Text style={styles.telemetryText}>{online ? '78%' : '--'}</Text>
                      </View>
                      <View style={styles.telemetryItem}>
                        <Ionicons name="wifi" size={16} color={online ? Colors.primary : Colors.textMuted} />
                        <Text style={styles.telemetryText}>{online ? 'Strong' : 'Lost'}</Text>
                      </View>
                      <View style={styles.telemetryItem}>
                        <Ionicons name="sync" size={16} color={Colors.textSecondary} />
                        <Text style={styles.telemetryText}>v1.2.4</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardFooter}>
                      <View style={styles.statusRow}>
                        <View style={[styles.pulseDot, { backgroundColor: online ? Colors.success : Colors.textMuted }]} />
                        <Text style={[styles.statusText, { color: online ? Colors.successDark : Colors.textSecondary }]}>
                          {online ? 'Active Connection' : 'Offline'}
                        </Text>
                      </View>
                      <Text style={styles.lastSeenText}>
                        Last sync: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : 'Never'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: Radius.lg, ...Shadows.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  metricLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 4 },
  metricValue: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionHeader: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textMuted, letterSpacing: 1, marginBottom: 16 },
  list: { gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: Radius.xl, ...Shadows.md, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 },
  deviceInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  deviceName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 2 },
  deviceCode: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pingBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, gap: 4 },
  pingText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  telemetryRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#F8FAFC', marginHorizontal: 16, borderRadius: Radius.md, marginBottom: 16 },
  telemetryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  telemetryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FAFAFA', borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  lastSeenText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
});
