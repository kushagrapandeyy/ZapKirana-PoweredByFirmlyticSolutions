import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Typically there would be a specific endpoint for user's orders.
      // Assuming GET /orders exists or we filter on client if using store endpoint
      // Mocking fetch from a known endpoint:
      const res = await fetch(`${API_BASE_URL}/orders/store/f15b0af3-3667-429a-ae2e-9f85d25e9c2f`); 
      if (res.ok) {
        const data = await res.json();
        const userOrders = data.filter((o: any) => o.customerId === CURRENT_CUSTOMER_ID);
        setOrders(userOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  const displayData = activeTab === 'ACTIVE' ? activeOrders : pastOrders;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return Colors.success;
      case 'CANCELLED': return Colors.danger;
      case 'OUT_FOR_DELIVERY': return Colors.accent;
      default: return Colors.primary;
    }
  };

  const renderOrder = ({ item, index }: { item: any; index: number }) => {
    const isDelivered = item.status === 'DELIVERED';
    const statusColor = getStatusColor(item.status);

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <TouchableOpacity 
          style={styles.orderCard} 
          activeOpacity={0.9}
          onPress={() => router.push(activeTab === 'ACTIVE' ? `/delivery-tracking?orderId=${item.id}` : `/order-confirmation?orderId=${item.id}`)}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.storeName}>Kwick Local Store</Text>
              <Text style={styles.orderDate}>
                {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.itemsPreview}>
            <View style={styles.imagesRow}>
              {item.items.slice(0, 3).map((orderItem: any, i: number) => (
                <View key={orderItem.id} style={[styles.itemThumbWrapper, { zIndex: 10 - i, marginLeft: i > 0 ? -15 : 0 }]}>
                  <Image 
                    source={{ uri: orderItem.product?.imageUrl || `https://placehold.co/100x100/f1f5f9/64748b?text=${encodeURIComponent(orderItem.product?.name?.substring(0,2) || 'Pr')}` }} 
                    style={styles.itemThumb} 
                  />
                </View>
              ))}
              {item.items.length > 3 && (
                <View style={[styles.itemThumbWrapper, styles.moreThumb, { zIndex: 1, marginLeft: -15 }]}>
                  <Text style={styles.moreThumbText}>+{item.items.length - 3}</Text>
                </View>
              )}
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{(item.totalAmount + item.deliveryFee).toFixed(2)}</Text>
            </View>
          </View>

          {isDelivered && (
            <View style={styles.reorderRow}>
              <TouchableOpacity style={styles.reorderBtn}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.reorderText}>Reorder Items</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rateBtn}>
                <Ionicons name="star-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.rateText}>Rate</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ACTIVE' && styles.tabActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>Active ({activeOrders.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PAST' && styles.tabActive]}
          onPress={() => setActiveTab('PAST')}
        >
          <Text style={[styles.tabText, activeTab === 'PAST' && styles.tabTextActive]}>Past ({pastOrders.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : displayData.length > 0 ? (
        <FlatList
          data={displayData}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={64} color={Colors.border} />
          </View>
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} orders</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'ACTIVE' 
              ? "You don't have any ongoing orders at the moment."
              : "You haven't completed any orders yet."}
          </Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface },
  title: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  listContent: { padding: 20, gap: 16 },
  orderCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  storeName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  orderDate: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16 },
  
  itemsPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  imagesRow: { flexDirection: 'row', alignItems: 'center' },
  itemThumbWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, padding: 2, ...Shadows.sm },
  itemThumb: { width: '100%', height: '100%', borderRadius: 22, backgroundColor: Colors.surfaceAlt },
  moreThumb: { backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  moreThumbText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textSecondary },
  
  priceContainer: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginBottom: 2 },
  totalValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  reorderRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  reorderBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryGhost, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primaryLight },
  reorderText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  rateBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  rateText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...Shadows.sm },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.full, ...Shadows.glow },
  shopBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
