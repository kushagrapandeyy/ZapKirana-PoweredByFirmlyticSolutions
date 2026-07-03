import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Mock data to supplement backend initially
const MOCK_STATS = {
  todaySales: 12450.00,
  ordersPending: 14,
  lowStockItems: 8,
  activeDeliveries: 3
};

export default function VendorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [stats, setStats] = useState(MOCK_STATS);

  const loadDashboard = async () => {
    try {
      const storeId = CURRENT_STORE_ID; // Bypass AsyncStorage cache for testing
      const storeRes = await fetch(`${API_BASE_URL}/stores/${storeId}`);
      if (storeRes.ok) {
        setStore(await storeRes.json());
      }
      
      // In a real implementation, we would fetch live KPIs here
      // For now, we rely on the mock data setup for UI demonstration
    } catch (e) {
      console.error(e);
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

  // Quick Action Buttons Map
  const QUICK_ACTIONS = [
    { id: 'scan', icon: 'barcode-outline', label: 'Scan Item', route: '/(tabs)/inventory', color: Colors.primary },
    { id: 'fulfill', icon: 'cube-outline', label: 'Pack Orders', route: '/(tabs)/fulfillment', color: Colors.accent },
    { id: 'pos', icon: 'calculator-outline', label: 'Quick POS', route: '/(tabs)/pos', color: Colors.success },
    { id: 'po', icon: 'document-text-outline', label: 'New PO', route: '/create-po', color: '#8b5cf6' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Store Dashboard</Text>
          <Text style={styles.storeName}>{store ? store.name : 'Loading...'}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle" size={40} color={Colors.primary} />
          <View style={styles.activeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Live KPIs */}
        <Animated.View entering={FadeInDown} style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: Colors.primaryGhost }]}>
              <View style={styles.kpiIconBox}>
                <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.kpiValue}>₹{stats.todaySales.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Today's Sales</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: Colors.accentLight }]}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#fff' }]}>
                <Ionicons name="time-outline" size={20} color={Colors.accentDark} />
              </View>
              <Text style={[styles.kpiValue, { color: Colors.accentDark }]}>{stats.ordersPending}</Text>
              <Text style={[styles.kpiLabel, { color: Colors.accentDark }]}>Orders to Pack</Text>
            </View>
          </View>
          
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: Colors.dangerLight }]}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#fff' }]}>
                <Ionicons name="warning-outline" size={20} color={Colors.dangerDark} />
              </View>
              <Text style={[styles.kpiValue, { color: Colors.dangerDark }]}>{stats.lowStockItems}</Text>
              <Text style={[styles.kpiLabel, { color: Colors.dangerDark }]}>Low Stock Alerts</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: Colors.successLight }]}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#fff' }]}>
                <Ionicons name="bicycle-outline" size={20} color={Colors.successDark} />
              </View>
              <Text style={[styles.kpiValue, { color: Colors.successDark }]}>{stats.activeDeliveries}</Text>
              <Text style={[styles.kpiLabel, { color: Colors.successDark }]}>Out for Delivery</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
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

        {/* Priority Alerts */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Priority Alerts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={20} color={Colors.danger} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Fresh Milk running low</Text>
              <Text style={styles.alertDesc}>Only 4 packets left. 12 daily subscriptions due tomorrow.</Text>
            </View>
            <TouchableOpacity style={styles.alertActionBtn} onPress={() => router.push('/create-po')}>
              <Text style={styles.alertActionText}>Order</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.alertCard, { borderLeftColor: Colors.warning }]}>
            <View style={[styles.alertIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="time" size={20} color={Colors.warningDark} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Delayed Fulfillment</Text>
              <Text style={styles.alertDesc}>3 orders are approaching their 30-min SLA limit.</Text>
            </View>
            <TouchableOpacity style={styles.alertActionBtn} onPress={() => router.push('/(tabs)/fulfillment')}>
              <Text style={styles.alertActionText}>View</Text>
            </TouchableOpacity>
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
  kpiValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.primaryDark, marginBottom: 4 },
  kpiLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.primary },
  
  section: { paddingHorizontal: 20, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  seeAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  actionBtn: { width: (width - 52) / 2, backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  actionIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.danger, ...Shadows.sm },
  alertIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dangerLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertContent: { flex: 1, paddingRight: 12 },
  alertTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  alertDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
  alertActionBtn: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  alertActionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
});
