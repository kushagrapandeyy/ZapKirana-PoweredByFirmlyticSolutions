import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const KANBAN_COLUMNS = [
  { id: 'PAID', label: 'To Pack', color: Colors.warning },
  { id: 'PICKING', label: 'Packing', color: Colors.primary },
  { id: 'READY_FOR_PICKUP', label: 'Ready', color: Colors.success },
];

export default function FulfillmentKanban() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCol, setActiveCol] = useState('PAID'); // For mobile, show one col at a time with tabs

  const fetchOrders = async () => {
    try {
      const storeId = CURRENT_STORE_ID; // Bypass AsyncStorage cache for testing
      const res = await fetch(`${API_BASE_URL}/orders/store/${storeId}`);
      if (res.ok) {
        const data = await res.json();
        // Only show relevant statuses for fulfillment
        const relevantOrders = data.filter((o: any) => 
          ['PAID', 'PICKING', 'READY_FOR_PICKUP'].includes(o.status)
        );
        setOrders(relevantOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const currentOrders = orders.filter(o => o.status === activeCol);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fulfillment</Text>
      </View>

      {/* Kanban Tabs for Mobile */}
      <View style={styles.tabsWrapper}>
        {KANBAN_COLUMNS.map(col => {
          const colCount = orders.filter(o => o.status === col.id).length;
          const isActive = activeCol === col.id;
          
          return (
            <TouchableOpacity 
              key={col.id} 
              style={[styles.tab, isActive && { borderBottomColor: col.color }]}
              onPress={() => setActiveCol(col.id)}
            >
              <Text style={[styles.tabText, isActive && { color: col.color }]}>{col.label}</Text>
              <View style={[styles.badge, isActive ? { backgroundColor: col.color } : { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={[styles.badgeText, isActive ? { color: '#fff' } : { color: Colors.textMuted }]}>{colCount}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {currentOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyText}>No orders in this column right now.</Text>
            </View>
          ) : (
            currentOrders.map((order, index) => (
              <Animated.View key={order.id} entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity 
                  style={[styles.orderCard, { borderTopColor: KANBAN_COLUMNS.find(c => c.id === activeCol)?.color }]}
                  onPress={() => router.push(`/order/${order.id}`)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>#{order.id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={styles.timeAgo}>
                      {Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000)}m ago
                    </Text>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <Text style={styles.itemCount}>{order.items.length} Items to pack</Text>
                    {order.deliverySlot !== 'ASAP' && (
                      <View style={styles.slotBadge}>
                        <Ionicons name="time" size={12} color={Colors.primary} />
                        <Text style={styles.slotText}>Slot: {order.deliverySlot}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.totalValue}>₹{(order.totalAmount + order.deliveryFee).toFixed(2)}</Text>
                    
                    {/* Action Button based on column */}
                    {activeCol === 'PAID' && (
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => updateOrderStatus(order.id, 'PICKING')}
                      >
                        <Text style={styles.actionBtnText}>Start Packing</Text>
                      </TouchableOpacity>
                    )}
                    {activeCol === 'PICKING' && (
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                        onPress={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                      >
                        <Text style={styles.actionBtnText}>Mark Ready</Text>
                      </TouchableOpacity>
                    )}
                    {activeCol === 'READY_FOR_PICKUP' && (
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: Colors.accent }]}
                        onPress={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                      >
                        <Text style={styles.actionBtnText}>Hand to Delivery</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface },
  headerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  tabsWrapper: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  
  scroll: { flex: 1 },
  list: { padding: 20, gap: 16, paddingBottom: 40 },
  
  orderCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm, borderTopWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  timeAgo: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  itemCount: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  slotBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryGhost, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  slotText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  totalValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  actionBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
