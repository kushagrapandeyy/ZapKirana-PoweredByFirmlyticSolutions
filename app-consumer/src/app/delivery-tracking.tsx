import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
const { width, height } = Dimensions.get('window');
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const MINUTE_MS = 60000;

const STATUS_STEPS = [
  { id: 'PAYMENT_PENDING', label: 'Order Placed', icon: 'receipt', color: Colors.primary },
  { id: 'PAID', label: 'Confirmed', icon: 'checkmark-circle', color: Colors.success },
  { id: 'PICKING', label: 'Packing', icon: 'cube', color: Colors.warning },
  { id: 'OUT_FOR_DELIVERY', label: 'On the Way', icon: 'bicycle', color: Colors.accent },
  { id: 'DELIVERED', label: 'Delivered', icon: 'home', color: Colors.success }
];

export default function DeliveryTrackingScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  
  // Animation values
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    // Pulse animation for active step
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    if (orderId) {
      fetchOrder();
      // Poll every 5s
      const interval = setInterval(fetchOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      if (res.ok) {
        setOrder(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 20 }} />
        <Text style={styles.loadingText}>Fetching order details...</Text>
      </SafeAreaView>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  
  // For 'READY_FOR_PICKUP' it maps to packing essentially for UI
  let activeIndex = currentStepIndex;
  if (order.status === 'READY_FOR_PICKUP') activeIndex = 2;

  const activeStepStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.substring(0, 8).toUpperCase()}</Text>
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Animated Map Area (Mock for now) */}
        <Animated.View entering={FadeIn} style={styles.mapContainer}>
          <View style={styles.mockMapBackground}>
            {/* Store Pin */}
            <View style={[styles.mapPin, { top: '30%', left: '20%' }]}>
              <Ionicons name="storefront" size={20} color="#fff" />
            </View>
            
            {/* User Pin */}
            <View style={[styles.mapPin, { bottom: '30%', right: '20%', backgroundColor: Colors.primary }]}>
              <Ionicons name="home" size={20} color="#fff" />
            </View>

            {/* Delivery Partner Pin (Animated if out for delivery) */}
            {activeIndex >= 3 && activeIndex < 4 && (
              <Animated.View style={[styles.mapPin, styles.deliveryPin, activeStepStyle]}>
                <Ionicons name="bicycle" size={24} color="#fff" />
              </Animated.View>
            )}
            
            {/* Route dashed line mock */}
            <View style={styles.mockRouteLine} />
          </View>
          
          {/* ETA Overlay */}
          {order.status !== 'DELIVERED' && (
            <View style={styles.etaOverlay}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaTime}>15-20 Mins</Text>
            </View>
          )}
        </Animated.View>

        {/* Tracking Stepper */}
        <View style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>Track Order</Text>
          
          <View style={styles.stepperContainer}>
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index < activeIndex;
              const isActive = index === activeIndex;
              const isLast = index === STATUS_STEPS.length - 1;

              return (
                <View key={step.id} style={styles.stepRow}>
                  {/* Icon & Line */}
                  <View style={styles.stepIconColumn}>
                    <Animated.View 
                      style={[
                        styles.stepIconBox,
                        isCompleted && { backgroundColor: step.color },
                        isActive && { backgroundColor: step.color, borderWidth: 4, borderColor: step.color + '40' },
                        isActive && activeStepStyle
                      ]}
                    >
                      <Ionicons 
                        name={step.icon as any} 
                        size={16} 
                        color={(isCompleted || isActive) ? '#fff' : Colors.textMuted} 
                      />
                    </Animated.View>
                    {!isLast && (
                      <View style={[styles.stepLine, isCompleted && { backgroundColor: step.color }]} />
                    )}
                  </View>
                  
                  {/* Text Details */}
                  <View style={styles.stepTextColumn}>
                    <Text style={[
                      styles.stepLabel, 
                      (isCompleted || isActive) && { color: Colors.textPrimary, fontFamily: 'Inter_700Bold' }
                    ]}>
                      {step.label}
                    </Text>
                    {isActive && (
                      <Text style={styles.stepSubLabel}>
                        {index === 0 && 'We have received your order'}
                        {index === 1 && 'Store has confirmed your order'}
                        {index === 2 && 'Your items are being packed carefully'}
                        {index === 3 && 'Delivery partner is on the way'}
                        {index === 4 && 'Enjoy your groceries!'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery OTP details */}
        {order.requireOtp && order.status !== 'DELIVERED' && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.otpCard}>
            <View style={styles.otpLeft}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
              <View>
                <Text style={styles.otpTitle}>Delivery OTP</Text>
                <Text style={styles.otpDesc}>Share with partner</Text>
              </View>
            </View>
            <View style={styles.otpCodeBox}>
              <Text style={styles.otpCode}>{order.customer?.phone?.slice(-4) || '1234'}</Text>
            </View>
          </Animated.View>
        )}

        {/* Order Details Preview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Order Items</Text>
            <Text style={styles.detailsCount}>{order.items.length} items</Text>
          </View>
          
          <View style={styles.itemsPreview}>
            {order.items.slice(0, 3).map((item: any, idx: number) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.product?.name}</Text>
                <Text style={styles.itemPrice}>₹{(item.quantity * item.priceAtOrder).toFixed(2)}</Text>
              </View>
            ))}
            {order.items.length > 3 && (
              <Text style={styles.moreItemsText}>+ {order.items.length - 3} more items</Text>
            )}
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{(order.totalAmount + order.deliveryFee).toFixed(2)}</Text>
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  loadingText: { marginTop: 20, fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  helpBtn: { padding: 4 },
  helpText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  
  scroll: { flex: 1 },
  
  mapContainer: { height: height * 0.35, backgroundColor: '#e2e8f0', position: 'relative' },
  mockMapBackground: { flex: 1, backgroundColor: '#cbd5e1' }, // Placeholder for actual map
  mapPin: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.textPrimary, justifyContent: 'center', alignItems: 'center', ...Shadows.md, zIndex: 10 },
  deliveryPin: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, top: '45%', left: '45%', zIndex: 20 },
  mockRouteLine: { position: 'absolute', top: '35%', left: '25%', right: '25%', height: 4, borderTopWidth: 4, borderColor: Colors.primary, borderStyle: 'dashed', opacity: 0.5, transform: [{ rotate: '15deg' }] },
  
  etaOverlay: { position: 'absolute', bottom: -20, left: 20, right: 20, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, alignItems: 'center', ...Shadows.lg },
  etaLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  etaTime: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  trackingCard: { backgroundColor: Colors.surface, marginTop: 40, marginHorizontal: 20, borderRadius: Radius.lg, padding: 20, ...Shadows.sm },
  trackingTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 20 },
  
  stepperContainer: {},
  stepRow: { flexDirection: 'row', minHeight: 60 },
  stepIconColumn: { alignItems: 'center', width: 40, marginRight: 16 },
  stepIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepLine: { width: 2, flex: 1, backgroundColor: Colors.surfaceAlt, marginVertical: -4, zIndex: 1 },
  stepTextColumn: { flex: 1, paddingBottom: 24 },
  stepLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 4 },
  stepSubLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, lineHeight: 18 },
  
  otpCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: Radius.lg, ...Shadows.sm },
  otpLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  otpTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  otpDesc: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  otpCodeBox: { backgroundColor: Colors.successLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  otpCode: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.successDark, letterSpacing: 2 },
  
  detailsCard: { backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16, marginBottom: 40, borderRadius: Radius.lg, padding: 20, ...Shadows.sm },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailsTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  detailsCount: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  itemsPreview: { gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemQty: { width: 30, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  itemName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, paddingRight: 10 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  moreItemsText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 4 },
  
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16, borderStyle: 'dashed' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  totalValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
});
