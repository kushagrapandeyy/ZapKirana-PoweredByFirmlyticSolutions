import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID, CURRENT_STAFF_ID } from '../../constants/api';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Columns for order states
const KANBAN_COLUMNS = [
  { id: 'PAID', label: 'New Orders', color: Colors.warning, icon: 'flash' },
  { id: 'PICKING', label: 'Packing', color: Colors.primary, icon: 'cube' },
  { id: 'READY_FOR_PICKUP', label: 'Ready', color: Colors.success, icon: 'checkmark-circle' },
  { id: 'OUT_FOR_DELIVERY', label: 'Dispatch', color: Colors.info, icon: 'bicycle' },
  { id: 'DELIVERED', label: 'Archive', color: Colors.textSecondary, icon: 'archive' },
];

export default function FulfillmentKanban() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeColIndex, setActiveColIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders?storeId=${CURRENT_STORE_ID}`);
      if (res.ok) {
        const data = await res.json();
        const relevantOrders = data.filter((o: any) => 
          ['PAID', 'PICKING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
        );
        // Sort newest first
        relevantOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const handleTabPress = (index: number) => {
    setActiveColIndex(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== activeColIndex) {
      setActiveColIndex(index);
    }
  };

  const getActionBtn = (order: any) => {
    let btnText = '';
    let iconName: any = '';
    let btnColor = '';
    let nextStatus = '';

    if (order.status === 'PAID') {
      btnText = 'START PACKING';
      iconName = 'cube-outline';
      btnColor = Colors.primary;
      nextStatus = 'PICKING';
    } else if (order.status === 'PICKING') {
      btnText = 'MARK READY';
      iconName = 'checkmark-circle-outline';
      btnColor = Colors.success;
      nextStatus = 'READY_FOR_PICKUP';
    } else if (order.status === 'READY_FOR_PICKUP') {
      btnText = 'DISPATCH ORDER';
      iconName = 'bicycle-outline';
      btnColor = Colors.info;
      nextStatus = 'OUT_FOR_DELIVERY';
    } else if (order.status === 'OUT_FOR_DELIVERY') {
      btnText = 'MARK DELIVERED';
      iconName = 'archive-outline';
      btnColor = Colors.textSecondary;
      nextStatus = 'DELIVERED';
    } else {
      return null;
    }

    return (
      <TouchableOpacity 
        style={[styles.fullWidthBtn, { backgroundColor: btnColor }]} 
        onPress={() => updateOrderStatus(order.id, nextStatus)}
        activeOpacity={0.8}
      >
        <Ionicons name={iconName} size={20} color="#fff" style={styles.btnIcon} />
        <Text style={styles.fullWidthBtnText}>{btnText}</Text>
      </TouchableOpacity>
    );
  };

  const renderOrderCard = ({ item }: { item: any }) => (
    <Animated.View 
      entering={FadeInDown.duration(400)} 
      exiting={FadeOutUp.duration(300)}
      layout={Layout.springify()}
      style={styles.cardContainer}
    >
      <View style={styles.orderCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>#{item.id.substring(0, 6).toUpperCase()}</Text>
            </View>
            <Text style={styles.orderTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>₹{item.totalAmount}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Ionicons name="person" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.customerName}>Customer ID: {item.userId.substring(0, 8)}</Text>
        </View>

        <View style={styles.divider} />

        {/* Items List */}
        <View style={styles.itemsWrapper}>
          <Text style={styles.itemsHeader}>{item.items.length} ITEMS TO PICK</Text>
          {item.items.map((orderItem: any, i: number) => (
            <View key={orderItem.id} style={[styles.itemRow, i % 2 !== 0 && styles.itemRowZebra]}>
              <View style={styles.qtyBox}>
                <Text style={styles.qtyBoxText}>{orderItem.quantity}</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{orderItem.product?.name || 'Unknown Item'}</Text>
            </View>
          ))}
        </View>

        {/* Footer Action */}
        <View style={styles.cardFooter}>
          {getActionBtn(item)}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topNav}>
        <Text style={styles.screenTitle}>Command Center</Text>
        <TouchableOpacity style={styles.scanBtn}>
          <Ionicons name="barcode-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {KANBAN_COLUMNS.map((col, index) => {
            const isActive = activeColIndex === index;
            const count = orders.filter(o => o.status === col.id).length;
            
            return (
              <TouchableOpacity 
                key={col.id} 
                style={[styles.tabBtn, isActive && { backgroundColor: col.color, borderColor: col.color }]}
                onPress={() => handleTabPress(index)}
              >
                <Ionicons name={col.icon as any} size={16} color={isActive ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.tabText, isActive && { color: '#fff', fontFamily: 'Inter_700Bold' }]}>
                  {col.label}
                </Text>
                <View style={[styles.tabBadge, isActive ? { backgroundColor: 'rgba(255,255,255,0.2)' } : {}]}>
                  <Text style={[styles.tabBadgeText, isActive ? { color: '#fff' } : {}]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Kanban Columns Pager */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.pagerView}
        >
          {KANBAN_COLUMNS.map(col => {
            const colOrders = orders.filter(o => o.status === col.id);
            return (
              <View key={col.id} style={styles.columnWrapper}>
                <FlatList
                  data={colOrders}
                  renderItem={renderOrderCard}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.columnList}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                      <View style={[styles.emptyIconCircle, { backgroundColor: col.color + '20' }]}>
                        <Ionicons name="checkmark-done" size={40} color={col.color} />
                      </View>
                      <Text style={styles.emptyStateTitle}>Zero Queue</Text>
                      <Text style={styles.emptyStateSub}>No {col.label.toLowerCase()} orders right now.</Text>
                    </View>
                  )}
                />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  screenTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, letterSpacing: -0.5 },
  scanBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  tabsContainer: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabsScroll: { paddingHorizontal: 20, gap: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  tabBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 4 },
  tabBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textSecondary },
  pagerView: { flex: 1 },
  columnWrapper: { width },
  columnList: { padding: 20, paddingBottom: 100 },
  cardContainer: { marginBottom: 20 },
  orderCard: { backgroundColor: '#fff', borderRadius: Radius.xl, overflow: 'hidden', ...Shadows.lg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 16 },
  headerLeft: { gap: 6 },
  orderIdBadge: { backgroundColor: Colors.primaryDark, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  orderIdText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 1 },
  orderTime: { color: Colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13 },
  priceTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  priceText: { color: Colors.successDark, fontFamily: 'Inter_700Bold', fontSize: 16 },
  customerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
  customerAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  customerName: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20, marginVertical: 16 },
  itemsWrapper: { paddingHorizontal: 20 },
  itemsHeader: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, gap: 12 },
  itemRowZebra: { backgroundColor: '#F8FAFC' },
  qtyBox: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: 6, justifyContent: 'center', alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  qtyBoxText: { color: Colors.primaryDark, fontFamily: 'Inter_700Bold', fontSize: 14 },
  itemName: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  cardFooter: { marginTop: 20, padding: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  fullWidthBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: Radius.lg, gap: 8, ...Shadows.md },
  btnIcon: { marginTop: -2 },
  fullWidthBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 8 },
  emptyStateSub: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
