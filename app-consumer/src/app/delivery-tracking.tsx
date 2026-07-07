import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, Dimensions, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows } from '../constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { API_BASE_URL } from '../constants/api';
import { supabase } from '../utils/supabase';

const { width, height } = Dimensions.get('window');

// Mock Data
const STORE_LOCATION = [77.5946, 12.9716]; 

export default function DeliveryTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // variables
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const [order, setOrder] = useState<any>(null);
  const [nearbyStores, setNearbyStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const displayOrderId = orderId ? (Array.isArray(orderId) ? orderId[0] : orderId).replace(/-/g, '').substring(0, 8).toUpperCase() : '12345678';

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Fallback polling

    let channel: any;
    if (orderId) {
      channel = supabase.channel(`order:${orderId}`)
        .on('broadcast', { event: 'order_status_change' }, (payload) => {
          console.log('Realtime order update received:', payload);
          fetchData(); 
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to order:${orderId} realtime channel`);
          }
        });
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchData = async () => {
    try {
      if (orderId) {
        // The display order ID passed is the short hash from confirmation page usually, 
        // but if it's the real UUID, fetch it. If we need to fetch all customer orders to find it:
        // Actually, orderId might be the UUID if passed from orders list.
        const orderRes = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrder(orderData);
        }
      }

      // Hardcoded coordinates for demo (Bangalore)
      const lat = 12.9716;
      const lng = 77.5946;
      const storesRes = await fetch(`${API_BASE_URL}/platform/stores/nearby?lat=${lat}&lng=${lng}&radiusKm=10`);
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        setNearbyStores(storesData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    //
  }, []);

  return (
    <View style={styles.container}>
      {/* Map Layer Mock */}
      <View style={[styles.map, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="map" size={64} color="#94a3b8" />
        <Text style={{ marginTop: 16, color: '#64748b', fontFamily: 'Inter_500Medium' }}>
          Map View (Native Build Required)
        </Text>
      </View>

      {/* Floating Back Button */}
      <SafeAreaView style={styles.floatingSafeArea} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
          
          {/* Driver Info Section */}
          <View style={styles.riderHeader}>
            <View style={styles.riderAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderTitle}>
                {order?.status === 'DELIVERED' ? 'Order Delivered' : 
                 order?.status === 'OUT_FOR_DELIVERY' ? 'Arriving in 12 min' : 'Preparing Order'}
              </Text>
              <Text style={styles.riderSubtitle}>
                {order?.status === 'DELIVERED' ? 'Enjoy your groceries!' :
                 order?.status === 'OUT_FOR_DELIVERY' ? 'Rider is on the way with your order' : 
                 'We are packing your items.'}
              </Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={20} color={Colors.surface} />
            </TouchableOpacity>
          </View>

          {/* OTP Section for Consumer */}
          {order?.requireOtp && order?.status !== 'DELIVERED' && (
            <View style={styles.otpCard}>
              <View style={styles.otpIcon}>
                <Ionicons name="key" size={20} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.otpLabel}>Delivery PIN</Text>
                <Text style={styles.otpDesc}>Share this PIN with the rider</Text>
              </View>
              <Text style={styles.otpValue}>
                {order?.id ? order.id.replace(/\D/g, '').substring(0,4).padEnd(4, '0') : '1234'}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Order Details Section */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <View style={styles.orderSummaryCard}>
              {order?.items?.map((item: any) => (
                <View key={item.id} style={styles.orderItem}>
                  <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                  <Text style={styles.orderItemName}>{item.product?.name || 'Item'}</Text>
                  <Text style={styles.orderItemPrice}>₹{item.priceAtOrder * item.quantity}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalAmount}>₹{order?.totalAmount || 0}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Ads Carousel */}
          <Text style={styles.sectionTitle}>Exclusive Offers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            <View style={[styles.adCard, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="pizza" size={32} color="#DC2626" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.adTitle}>50% OFF Domino's</Text>
                <Text style={styles.adSubtitle}>Valid till midnight</Text>
              </View>
            </View>
            <View style={[styles.adCard, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="cart" size={32} color="#4F46E5" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.adTitle}>Free Delivery</Text>
                <Text style={styles.adSubtitle}>On your next 3 orders</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.divider} />

          {/* Cross Selling - Nearby Stores & Top Products */}
          <Text style={styles.sectionTitle}>Explore Nearby Stores</Text>
          {nearbyStores.map(store => (
            <View key={store.id} style={styles.storeCrossSellCard}>
              <View style={styles.storeHeader}>
                <View style={styles.storeIconWrapper}>
                  <Ionicons name="storefront" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeDistance}>{store.distanceKm} km away • {store.availableSkus} items in stock</Text>
                </View>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topProductsCarousel}>
                {store.topProducts?.map((product: any) => (
                  <TouchableOpacity key={product.id} style={styles.topProductCard} onPress={() => router.push(`/product/${product.id}`)}>
                    <Image source={{ uri: product.imageUrl }} style={styles.topProductImage} />
                    <Text style={styles.topProductPrice}>₹{product.sellingPrice}</Text>
                    <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
          
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  map: { flex: 1 },
  floatingSafeArea: { position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn: {
    backgroundColor: Colors.surface, width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: 16,
    ...Shadows.sm,
  },
  bottomSheetBackground: { backgroundColor: '#F8FAFC', borderRadius: 24 },
  handleIndicator: { backgroundColor: '#CBD5E1', width: 40 },
  contentContainer: { padding: 20, paddingBottom: 60 },
  riderHeader: { flexDirection: 'row', alignItems: 'center' },
  riderAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  riderInfo: { flex: 1 },
  riderTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  riderSubtitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  orderSummaryCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, ...Shadows.sm },
  orderItem: { flexDirection: 'row', marginBottom: 12 },
  orderItemQty: { width: 30, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  orderItemName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  orderItemPrice: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  totalAmount: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  otpCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: 12, padding: 16, marginTop: 20 },
  otpIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  otpLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#b45309' },
  otpDesc: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#d97706', marginTop: 2 },
  otpValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#b45309', letterSpacing: 4 },
  carousel: { marginHorizontal: -20, paddingHorizontal: 20 },
  adCard: {
    width: 260, height: 80, borderRadius: Radius.lg, flexDirection: 'row',
    alignItems: 'center', padding: 16, marginRight: 12,
  },
  adTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 2 },
  adSubtitle: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#475569' },
  storeCrossSellCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, marginBottom: 16, ...Shadows.sm },
  storeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  storeIconWrapper: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  storeName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 2 },
  storeDistance: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  topProductsCarousel: { marginHorizontal: -16, paddingHorizontal: 16 },
  topProductCard: { width: 100, marginRight: 12 },
  topProductImage: { width: 100, height: 100, borderRadius: Radius.md, backgroundColor: '#F1F5F9', marginBottom: 8 },
  topProductPrice: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 2 },
  topProductName: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
});
