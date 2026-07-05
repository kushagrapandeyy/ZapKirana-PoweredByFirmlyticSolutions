import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

export default function AlertsInbox() {
  const { tenantId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/alerts?storeId=${tenantId}`);
      if (res.ok) {
        setAlerts(await res.json());
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

  const renderAlertCard = (icon: any, color: string, title: string, count: number, items: any[], typeLabel: string, actionLabel: string = 'Review') => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.alertGroup}>
        <View style={styles.groupHeader}>
          <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={styles.groupTitle}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        </View>

        <View style={styles.inboxWrapper}>
          {items.map((item, i) => (
            <Animated.View key={item.id || i} entering={FadeInDown.delay(i * 30).springify().damping(15)}>
              <TouchableOpacity style={styles.inboxItem} activeOpacity={0.7}>
                <View style={[styles.inboxDot, { backgroundColor: color }]} />
                <View style={styles.inboxContent}>
                  <Text style={styles.inboxItemTitle}>{item.name}</Text>
                  <Text style={styles.inboxItemSub}>{typeLabel}: {item.stockLevel ?? item.onHandQty}</Text>
                </View>
                <TouchableOpacity style={[styles.quickAction, { backgroundColor: color + '15' }]}>
                  <Text style={[styles.quickActionText, { color }]}>{actionLabel}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              {i < items.length - 1 && <View style={styles.divider} />}
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Intelligent Inbox</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="filter" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {!loading && alerts && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.healthBanner}>
          <View style={styles.healthStats}>
            <Text style={styles.healthScore}>{(alerts.lowStockCount || alerts.damagedCount) ? '88%' : '100%'}</Text>
            <Text style={styles.healthLabel}>System Health</Text>
          </View>
          <View style={styles.healthDivider} />
          <View style={styles.healthStats}>
            <Text style={[styles.healthScore, { color: Colors.danger }]}>{alerts.lowStockCount + alerts.damagedCount + alerts.expiringCount}</Text>
            <Text style={styles.healthLabel}>Active Alerts</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          alerts ? (
            <>
              {renderAlertCard('warning', '#D97706', 'Low Stock Warnings', alerts.lowStockCount, alerts.lowStockItems, 'Current Stock', 'Reorder')}
              {renderAlertCard('alert-circle', '#DC2626', 'Damaged Goods Reported', alerts.damagedCount, alerts.damagedItems, 'Damaged Qty', 'Write-off')}
              {renderAlertCard('time', '#9333EA', 'Expiring Soon', alerts.expiringCount, alerts.expiringItems, 'Expiring Qty', 'Discount')}

              {(!alerts.lowStockCount && !alerts.damagedCount && !alerts.expiringCount) && (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-done-circle" size={80} color={Colors.success} />
                  <Text style={styles.emptyTitle}>Inbox Zero</Text>
                  <Text style={styles.emptySub}>No operational alerts require your attention.</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.emptySub}>Failed to load alerts.</Text>
          )
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
  actionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  alertGroup: { marginBottom: 32 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  inboxWrapper: { backgroundColor: '#fff', borderRadius: Radius.xl, ...Shadows.md, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  inboxItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  inboxDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 16 },
  inboxContent: { flex: 1 },
  inboxItemTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  inboxItemSub: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginTop: 24, marginBottom: 8 },
  emptySub: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  quickAction: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  quickActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  healthBanner: { flexDirection: 'row', backgroundColor: Colors.primaryDark, marginHorizontal: 20, marginBottom: 20, borderRadius: Radius.lg, padding: 20, ...Shadows.md },
  healthStats: { flex: 1, alignItems: 'center' },
  healthScore: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 4 },
  healthLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 },
  healthDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }
});
