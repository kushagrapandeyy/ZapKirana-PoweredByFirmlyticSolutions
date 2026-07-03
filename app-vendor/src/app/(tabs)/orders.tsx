import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID, CURRENT_STAFF_ID } from '../../constants/api';
import Animated, { FadeIn } from 'react-native-reanimated';

// Columns for order states
const KANBAN_COLUMNS = [
  { id: 'PAID', label: 'New Orders', color: Colors.warning },
  { id: 'PICKING', label: 'Packing', color: Colors.primary },
  { id: 'READY_FOR_PICKUP', label: 'Ready', color: Colors.success },
];

export default function FulfillmentKanban() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCol, setActiveCol] = useState('PAID');
  
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders?storeId=${CURRENT_STORE_ID}`);
      if (res.ok) {
        const data = await res.json();
        const relevantOrders = data.filter((o: any) => 
          ['PAID', 'PICKING', 'READY_FOR_PICKUP'].includes(o.status)
        );
        // Sort newest first
        relevantOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    const interval = setInterval(fetchOrders, 5000); // Live incoming orders flow
    return () => clearInterval(interval);
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
        body: JSON.stringify({ status: newStatus, staffId: CURRENT_STAFF_ID })
      });
      if (res.ok) fetchOrders();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const getActionBtn = (order: any) => {
    if (order.status === 'PAID') {
      return (
        <TouchableOpacity style={styles.actionBtn} onPress={() => updateOrderStatus(order.id, 'PICKING')}>
          <Text style={styles.actionBtnText}>Start Packing</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      );
    }
    if (order.status === 'PICKING') {
      return (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}>
          <Text style={styles.actionBtnText}>Mark Ready</Text>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const currentOrders = orders.filter(o => o.status === activeCol);

  const renderOrderCard = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>₹{item.totalAmount}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsList}>
          {item.items.map((orderItem: any) => (
            <View key={orderItem.id} style={styles.itemRow}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{orderItem.quantity}x</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{orderItem.product?.name || 'Item'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.customerInfo}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.customerName}>Customer</Text>
          </View>
          {getActionBtn(item)}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Orders</Text>
      </View>

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
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={currentOrders}
          renderItem={renderOrderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No {KANBAN_COLUMNS.find(c => c.id === activeCol)?.label.toLowerCase()} orders right now.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  tabsWrapper: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginRight: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  list: { padding: 20, paddingBottom: 100 },
  orderCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, marginBottom: 16, ...Shadows.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  orderTime: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginTop: 2 },
  priceTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  priceText: { color: Colors.success, fontFamily: 'Inter_700Bold', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  itemsList: { gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  qtyText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
  itemName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  actionBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
});
