import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 'pos', label: 'POS Terminal', icon: 'calculator', route: '/(tabs)/pos', color: Colors.primary },
  { id: 'scanner', label: 'Scanner Fleet', icon: 'barcode-outline', route: '/operations/devices', color: Colors.accentDark },
  { id: 'staff', label: 'Team', icon: 'people-outline', route: '/(tabs)/team', color: Colors.success },
  { id: 'orders', label: 'Orders', icon: 'cube-outline', route: '/(tabs)/orders', color: Colors.info },
];

export default function VendorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [inventoryHealth, setInventoryHealth] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  const loadDashboard = async () => {
    try {
      const storeId = CURRENT_STORE_ID;

      const [storeRes, profitRes, healthRes, topRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stores/${storeId}`),
        fetch(`${API_BASE_URL}/analytics/profit?storeId=${storeId}`),
        fetch(`${API_BASE_URL}/analytics/inventory-health?storeId=${storeId}`),
        fetch(`${API_BASE_URL}/analytics/top-products?storeId=${storeId}&limit=5&days=30`),
        fetch(`${API_BASE_URL}/orders?storeId=${storeId}`)
      ]);

      if (storeRes.ok) setStore(await storeRes.json());
      if (profitRes.ok) setProfitData(await profitRes.json());
      if (healthRes.ok) setInventoryHealth(await healthRes.json());
      if (topRes.ok) setTopProducts(await topRes.json());

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        // Count active orders (PAID, PICKING, READY_FOR_PICKUP) as actionable notifications
        const activeCount = ordersData.filter((o: any) => ['PAID', 'PICKING', 'READY_FOR_PICKUP'].includes(o.status)).length;
        setActiveOrdersCount(activeCount);
      }


    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Store Operations</Text>
          <Text style={styles.storeName}>{store?.name || 'Zapkirana Store'}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-circle" size={42} color={Colors.primary} />
          <View style={styles.activeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Layer 1: Command Center Big Button */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ padding: 20, paddingBottom: 0 }}>
          <TouchableOpacity
            style={styles.commandCenterBtn}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={styles.ccContent}>
              <View style={styles.ccIconBg}>
                <Ionicons name="flash" size={32} color="#fff" />
              </View>
              <View style={styles.ccTextWrap}>
                <Text style={styles.ccTitle}>Command Center</Text>
                <Text style={styles.ccSub}>Fulfillment & Operations Queue</Text>
              </View>
            </View>
            <View style={styles.ccBadge}>
              <Text style={styles.ccBadgeText}>{activeOrdersCount}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Layer 2: Executive Snapshot */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.snapshotSection}>
          <View style={styles.snapshotCard}>
            <View style={styles.snapshotTop}>
              <View>
                <Text style={styles.snapshotLabel}>Total Revenue</Text>
                <Text style={styles.snapshotValue}>₹{(profitData?.totalRevenue || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.snapshotIconBox}>
                <Ionicons name="stats-chart" size={24} color="#fff" />
              </View>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotBottom}>
              <View>
                <Text style={styles.snapshotSubLabel}>Net Profit</Text>
                <Text style={styles.snapshotSubValue}>₹{(profitData?.netProfit || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.marginBadge}>
                <Text style={styles.marginText}>{profitData?.profitMargin || '0%'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewFinBtn} onPress={() => router.push('/financials')}>
              <Text style={styles.viewFinText}>View Financial Deep Dive</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Layer 2: Inventory Health Alerts */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Health</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizScroll}>
            <View style={[styles.healthCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Ionicons name="warning" size={24} color={Colors.danger} style={{ marginBottom: 8 }} />
              <Text style={styles.healthValue}>{inventoryHealth?.lowStockCount || 0}</Text>
              <Text style={styles.healthLabel}>Low Stock Items</Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
              <Ionicons name="time" size={24} color="#ea580c" style={{ marginBottom: 8 }} />
              <Text style={styles.healthValue}>{inventoryHealth?.expiringSoonCount || 0}</Text>
              <Text style={styles.healthLabel}>Expiring Soon</Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
              <Ionicons name="cube" size={24} color={Colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={styles.healthValue}>{inventoryHealth?.deadStockCount || 0}</Text>
              <Text style={styles.healthLabel}>Dead Stock (30d)</Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Layer 3: Top Moving Products */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Top Moving Products</Text>
          {topProducts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizScroll}>
              {topProducts.map((p, i) => (
                <View key={p.productId} style={styles.productCard}>
                  <View style={styles.rankBadge}><Text style={styles.rankText}>#{i + 1}</Text></View>
                  <Text style={styles.productName} numberOfLines={1}>{p.productName}</Text>
                  <Text style={styles.productUnits}>{p.unitsSold} Units Sold</Text>
                  <Text style={styles.productRev}>₹{p.revenue.toLocaleString()}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent sales data to calculate top products.</Text>
            </View>
          )}
        </Animated.View>

        {/* Layer 4: Streamlined Operations Hub */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Operations Hub</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizScroll}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionStripBtn}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBoxSmall, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabelStrip}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  greeting: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 2 },
  storeName: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  profileBtn: { position: 'relative' },
  activeDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.surface },

  scroll: { flex: 1 },

  snapshotSection: { padding: 20 },
  snapshotCard: { backgroundColor: '#064e3b', borderRadius: Radius.lg, padding: 24, ...Shadows.md },
  snapshotTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  snapshotLabel: { color: '#a7f3d0', fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  snapshotValue: { color: '#ffffff', fontSize: 32, fontFamily: 'Inter_700Bold' },
  snapshotIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  snapshotDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  snapshotBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
  snapshotSubLabel: { color: '#a7f3d0', fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  snapshotSubValue: { color: '#ffffff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  marginBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  marginText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  viewFinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, gap: 8 },
  viewFinText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  commandCenterBtn: { backgroundColor: Colors.primaryDark, borderRadius: Radius.xl, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadows.lg },
  ccContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ccIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  ccTextWrap: { flex: 1 },
  ccTitle: { color: '#fff', fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', letterSpacing: 0.5, marginBottom: 4 },
  ccSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_500Medium' },
  ccBadge: { backgroundColor: Colors.warning, minWidth: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  ccBadgeText: { color: '#000', fontSize: 16, fontFamily: 'Inter_700Bold' },

  section: { marginTop: 12 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, paddingHorizontal: 20, marginBottom: 12 },

  horizScroll: { paddingHorizontal: 20, gap: 12 },
  healthCard: { width: 140, padding: 16, borderRadius: Radius.lg, borderWidth: 1, ...Shadows.sm },
  healthValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  healthLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },

  productCard: { width: 160, padding: 16, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  rankBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: Colors.primaryGhost, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rankText: { color: Colors.primary, fontSize: 10, fontFamily: 'Inter_700Bold' },
  productName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 12, marginBottom: 8 },
  productUnits: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 4 },
  productRev: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.successDark },

  emptyCard: { marginHorizontal: 20, padding: 20, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },

  actionStripBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 100, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  actionIconBoxSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  actionLabelStrip: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
});
