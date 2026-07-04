import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import { LineChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 'pos', label: 'POS Terminal', icon: 'calculator', route: '/(tabs)/pos', color: Colors.primary },
  { id: 'inventory', label: 'Inventory', icon: 'cube-outline', route: '/operations/inventory', color: Colors.info },
  { id: 'scanner', label: 'Scanner Fleet', icon: 'barcode-outline', route: '/operations/devices', color: Colors.accentDark },
  { id: 'staff', label: 'Staff & HR', icon: 'people-outline', route: '/operations/staff', color: Colors.success },
];

export default function VendorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);

  const loadDashboard = async () => {
    try {
      const storeId = CURRENT_STORE_ID; 
      
      const [storeRes, profitRes, revRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stores/${storeId}`),
        fetch(`${API_BASE_URL}/analytics/profit?storeId=${storeId}`),
        fetch(`${API_BASE_URL}/analytics/revenue?storeId=${storeId}&from=2026-06-01&to=2026-07-31`)
      ]);

      if (storeRes.ok) setStore(await storeRes.json());
      if (profitRes.ok) setProfitData(await profitRes.json());
      if (revRes.ok) setRevenueData(await revRes.json());
      
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

  const pieData = profitData ? [
    {
      name: 'Profit',
      population: profitData.netProfit,
      color: Colors.success,
      legendFontColor: Colors.textSecondary,
    },
    {
      name: 'PO Cost',
      population: profitData.totalCOGS,
      color: Colors.info,
      legendFontColor: Colors.textSecondary,
    },
    {
      name: 'Expenses',
      population: profitData.totalExpenses,
      color: Colors.danger,
      legendFontColor: Colors.textSecondary,
    }
  ] : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Command Center</Text>
          <Text style={styles.storeName}>{store?.name || 'Basko Store'}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle" size={42} color={Colors.primary} />
          <View style={styles.activeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Live KPIs */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: Colors.primaryGhost }]}>
              <View style={styles.kpiIconBox}>
                <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.kpiValue}>₹{(profitData?.totalRevenue || 0).toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Total Revenue</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: Colors.successLight }]}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#fff' }]}>
                <Ionicons name="trending-up-outline" size={20} color={Colors.successDark} />
              </View>
              <Text style={[styles.kpiValue, { color: Colors.successDark }]}>₹{(profitData?.netProfit || 0).toLocaleString()}</Text>
              <Text style={[styles.kpiLabel, { color: Colors.successDark }]}>Net Profit ({profitData?.profitMargin || '0%'})</Text>
            </View>
          </View>
        </Animated.View>

        {/* Charts Section */}
        {profitData && (
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>P&L Breakdown</Text>
            <View style={styles.chartCard}>
              <PieChart
                data={pieData}
                width={width - 72}
                height={160}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Operations Hub</Text>
          <View style={styles.actionGrid}>
            {QUICK_ACTIONS.map((action, idx) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.actionBtn}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
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
  
  kpiContainer: { padding: 16, gap: 12 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCard: { flex: 1, padding: 16, borderRadius: Radius.lg, ...Shadows.sm },
  kpiIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  kpiValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.primaryDark, marginBottom: 4 },
  kpiLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.primary },
  
  section: { paddingHorizontal: 20, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  
  chartCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm, alignItems: 'center' },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  actionBtn: { width: (width - 52) / 2, backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  actionIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
});
