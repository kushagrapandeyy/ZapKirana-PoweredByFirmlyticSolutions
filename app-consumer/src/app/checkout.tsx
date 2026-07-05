import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Switch, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, SlideInDown, FadeOut, SlideOutDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../constants/api';

const { height } = Dimensions.get('window');

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5'; // Mock User
const MOCK_STORE_LAT = 12.9716;
const MOCK_STORE_LNG = 77.5946;

// Haversine distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [deliveryType, setDeliveryType] = useState<'PRIORITY' | 'NORMAL' | 'SCHEDULED'>('NORMAL');
  const [scheduledSlot, setScheduledSlot] = useState<'10_12' | '14_16' | '18_20' | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [requireOtp, setRequireOtp] = useState(false);
  const [instructions, setInstructions] = useState('');
  
  const [address, setAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);

  // MOCK: Checking if user is first time (Normally from backend)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);

  // Razorpay Mock State
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
      checkFirstTimeUser();
    }, [])
  );

  const checkFirstTimeUser = async () => {
    // Check local storage if they've ordered before to mock it
    const hasOrdered = await AsyncStorage.getItem('@has_ordered_before');
    if (hasOrdered === 'true') setIsFirstTimeUser(false);
  };

  const fetchAddresses = async () => {
    try {
      setLoadingAddress(true);
      const res = await fetch(`${API_BASE_URL}/addresses?userId=${CURRENT_CUSTOMER_ID}`);
      if (res.ok) {
        const data = await res.json();
        const defaultAddr = data.find((a: any) => a.isDefault) || data[0];
        setAddress(defaultAddr || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddress(false);
    }
  };

  // --- Dynamic Pricing Engine ---
  const distanceKm = useMemo(() => {
    if (!address?.latitude || !address?.longitude) return 0;
    return getDistanceFromLatLonInKm(MOCK_STORE_LAT, MOCK_STORE_LNG, address.latitude, address.longitude);
  }, [address]);

  const deliveryFee = useMemo(() => {
    let fee = 0;
    // 1% of total if distance > 1km
    if (distanceKm > 1) {
      fee += cartTotal * 0.01;
    }
    // Priority flat fee
    if (deliveryType === 'PRIORITY') {
      fee += 15;
    }
    return fee;
  }, [distanceKm, cartTotal, deliveryType]);

  const firstTimeDiscount = useMemo(() => {
    if (!isFirstTimeUser) return 0;
    // 20% up to ₹100
    const discount = cartTotal * 0.20;
    return Math.min(discount, 100);
  }, [cartTotal, isFirstTimeUser]);

  const grandTotal = cartTotal + deliveryFee - firstTimeDiscount;

  const initiatePayment = () => {
    if (cart.length === 0) return;
    
    if (!address) {
      Toast.show({ type: 'error', text1: 'Delivery Address Required', text2: 'Please add a delivery address to continue.' });
      return;
    }
    
    if (deliveryType === 'SCHEDULED' && !scheduledSlot) {
      Toast.show({ type: 'error', text1: 'Time Slot Required', text2: 'Please select a delivery slot.' });
      return;
    }

    if (paymentMethod === 'CASH') {
      processOrder();
    } else {
      setShowRazorpay(true); // Open Mock Razorpay
    }
  };

  const processOrder = async () => {
    setIsProcessing(true);
    setRazorpayLoading(false);
    setShowRazorpay(false);

    try {
      const storeId = await AsyncStorage.getItem('@selected_store_id') || CURRENT_STORE_ID;
      
      const orderPayload = {
        storeId,
        customerId: CURRENT_CUSTOMER_ID,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.qty })),
        delivery: {
          address: `${address.flatNumber ? address.flatNumber + ', ' : ''}${address.streetAddress ? address.streetAddress + ', ' : ''}${address.address}`,
          lat: address.latitude || 12.9750,
          lng: address.longitude || 77.5950
        },
        deliverySlot: deliveryType === 'SCHEDULED' ? scheduledSlot : (deliveryType === 'PRIORITY' ? 'ASAP' : 'NORMAL'),
        requireOtp,
        deliveryInstructions: instructions,
        discountApplied: firstTimeDiscount,
        deliveryFee
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const orderData = await res.json();
        
        await fetch(`${API_BASE_URL}/orders/${orderData.id}/pay`, { method: 'POST' });
        
        await AsyncStorage.setItem('@has_ordered_before', 'true');
        clearCart();
        router.replace(`/order-confirmation?orderId=${orderData.id}`);
      } else {
        const err = await res.json();
        Toast.show({ type: 'error', text1: err.message || 'Checkout failed', text2: 'Please check your delivery details.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Could not complete the transaction.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <Animated.View entering={SlideInDown.delay(50)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/address-manager')}>
              <Text style={styles.changeText}>{address ? 'Change' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          
          {loadingAddress ? (
             <ActivityIndicator size="small" color={Colors.primary} />
          ) : address ? (
            <View style={styles.card}>
              <View style={styles.addressRow}>
                <View style={styles.addressIcon}>
                  <Ionicons name="home" size={20} color={Colors.primary} />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressTitle}>{address.label}</Text>
                  <Text style={styles.addressText}>{address.flatNumber ? `${address.flatNumber}, ` : ''}{address.streetAddress ? `${address.streetAddress}, ` : ''}{address.address}</Text>
                  <Text style={styles.addressText}>{address.city}, {address.pincode}</Text>
                  {distanceKm > 1 && (
                    <Text style={styles.distanceWarning}><Ionicons name="information-circle" size={12}/> Distance is {(distanceKm).toFixed(1)}km. Nominal fee applies.</Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.card} onPress={() => router.push('/address-manager')}>
               <View style={[styles.addressRow, { alignItems: 'center' }]}>
                 <View style={styles.addressIcon}>
                   <Ionicons name="add" size={24} color={Colors.primary} />
                 </View>
                 <Text style={[styles.addressTitle, { marginBottom: 0 }]}>Select or add an address</Text>
               </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Delivery Type */}
        <Animated.View entering={SlideInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          
          <TouchableOpacity 
            style={[styles.deliveryTypeCard, deliveryType === 'PRIORITY' && styles.deliveryTypeCardActive]}
            onPress={() => { setDeliveryType('PRIORITY'); setScheduledSlot(null); }}
          >
            <View style={styles.dtIcon}><Ionicons name="flash" size={20} color={deliveryType === 'PRIORITY' ? Colors.primary : Colors.textSecondary} /></View>
            <View style={styles.dtInfo}>
              <Text style={[styles.dtTitle, deliveryType === 'PRIORITY' && styles.dtTitleActive]}>Priority Express</Text>
              <Text style={styles.dtSub}>Delivery in ~15 mins</Text>
            </View>
            <Text style={[styles.dtPrice, deliveryType === 'PRIORITY' && styles.dtPriceActive]}>+₹15</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deliveryTypeCard, deliveryType === 'NORMAL' && styles.deliveryTypeCardActive]}
            onPress={() => { setDeliveryType('NORMAL'); setScheduledSlot(null); }}
          >
            <View style={styles.dtIcon}><Ionicons name="bicycle" size={20} color={deliveryType === 'NORMAL' ? Colors.primary : Colors.textSecondary} /></View>
            <View style={styles.dtInfo}>
              <Text style={[styles.dtTitle, deliveryType === 'NORMAL' && styles.dtTitleActive]}>Standard Delivery</Text>
              <Text style={styles.dtSub}>Delivery in ~45 mins</Text>
            </View>
            <Text style={[styles.dtPrice, deliveryType === 'NORMAL' && styles.dtPriceActive]}>
              {distanceKm > 1 ? '+1%' : 'Free'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deliveryTypeCard, deliveryType === 'SCHEDULED' && styles.deliveryTypeCardActive]}
            onPress={() => setDeliveryType('SCHEDULED')}
          >
            <View style={styles.dtIcon}><Ionicons name="calendar" size={20} color={deliveryType === 'SCHEDULED' ? Colors.primary : Colors.textSecondary} /></View>
            <View style={styles.dtInfo}>
              <Text style={[styles.dtTitle, deliveryType === 'SCHEDULED' && styles.dtTitleActive]}>Scheduled Delivery</Text>
              <Text style={styles.dtSub}>Pick a time slot</Text>
            </View>
          </TouchableOpacity>

          {/* Scheduled Slots Drawer */}
          {deliveryType === 'SCHEDULED' && (
            <Animated.View entering={FadeIn} style={styles.scheduledWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {['10_12', '14_16', '18_20'].map(slot => (
                  <TouchableOpacity 
                    key={slot}
                    style={[styles.slotChip, scheduledSlot === slot && styles.slotChipActive]}
                    onPress={() => setScheduledSlot(slot as any)}
                  >
                    <Text style={[styles.slotText, scheduledSlot === slot && styles.slotTextActive]}>
                      {slot.replace('_', ':00 - ')}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={SlideInDown.delay(150)} style={styles.section}>
          <View style={[styles.card, styles.instructionCard]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.textMuted} />
            <TextInput 
              style={styles.instructionInput} 
              placeholder="Add instructions for delivery partner"
              placeholderTextColor={Colors.textMuted}
              value={instructions}
              onChangeText={setInstructions}
            />
          </View>

          <View style={[styles.card, styles.rowCard]}>
            <View style={styles.rowCardContent}>
              <View style={styles.iconBox}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowCardTitle}>Require Delivery OTP</Text>
                <Text style={styles.rowCardDesc}>Driver will need the OTP sent to your phone to complete delivery.</Text>
              </View>
            </View>
            <Switch 
              value={requireOtp} 
              onValueChange={setRequireOtp} 
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor="#fff"
            />
          </View>
        </Animated.View>

        {/* Bill Details */}
        <Animated.View entering={SlideInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee {deliveryType === 'PRIORITY' ? '(Priority)' : (distanceKm > 1 ? '(Distance)' : '')}</Text>
              <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            
            {isFirstTimeUser && (
              <View style={styles.billRow}>
                <Text style={styles.billDiscountLabel}>First Order Discount (20%)</Text>
                <Text style={styles.billDiscountValue}>-₹{firstTimeDiscount.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.billDivider} />
            
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Grand Total</Text>
              <Text style={styles.billTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Payment Method */}
        <Animated.View entering={SlideInDown.delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'UPI' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('UPI')}>
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="qr-code" size={24} color={paymentMethod === 'UPI' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.paymentText, paymentMethod === 'UPI' && styles.paymentTextActive]}>UPI (GPay, PhonePe)</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'UPI' && styles.radioActive]}>
                {paymentMethod === 'UPI' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'CARD' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('CARD')}>
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="card" size={24} color={paymentMethod === 'CARD' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.paymentText, paymentMethod === 'CARD' && styles.paymentTextActive]}>Credit / Debit Card</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'CARD' && styles.radioActive]}>
                {paymentMethod === 'CARD' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'CASH' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('CASH')}>
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="cash" size={24} color={paymentMethod === 'CASH' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.paymentText, paymentMethod === 'CASH' && styles.paymentTextActive]}>Cash on Delivery</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'CASH' && styles.radioActive]}>
                {paymentMethod === 'CASH' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.totalLabel}>Total to Pay</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.payBtn, isProcessing && styles.payBtnDisabled]} 
          onPress={initiatePayment} 
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Animated.View entering={FadeIn} style={styles.payBtnContent}>
              <Ionicons name={paymentMethod === 'CASH' ? 'checkmark-circle' : 'lock-closed'} size={18} color="#fff" />
              <Text style={styles.payBtnText}>{paymentMethod === 'CASH' ? 'Place Order' : 'Pay Now'}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {/* Mock Razorpay Bottom Sheet */}
      {showRazorpay && (
        <Modal transparent visible={showRazorpay} animationType="none" onRequestClose={() => setShowRazorpay(false)}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.rzOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowRazorpay(false)} />
            
            <Animated.View entering={SlideInDown.duration(300)} exiting={SlideOutDown.duration(200)} style={styles.rzSheet}>
              <View style={styles.rzHeader}>
                <View style={styles.rzLogo}>
                  <Text style={styles.rzLogoText}>₹</Text>
                </View>
                <View>
                  <Text style={styles.rzMerchant}>Basko Checkout (Test Mode)</Text>
                  <Text style={styles.rzAmount}>₹{grandTotal.toFixed(2)}</Text>
                </View>
              </View>

              <Text style={styles.rzSectionTitle}>Pay Using</Text>
              
              <TouchableOpacity 
                style={styles.rzMethod}
                onPress={() => {
                  setRazorpayLoading(true);
                  setTimeout(() => { processOrder(); }, 1500);
                }}
              >
                <View style={styles.rzIconWrap}><Ionicons name="qr-code" size={24} color="#3b82f6" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rzMethodTitle}>UPI</Text>
                  <Text style={styles.rzMethodSub}>Google Pay, PhonePe, Paytm</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rzMethod}
                onPress={() => {
                  setRazorpayLoading(true);
                  setTimeout(() => { processOrder(); }, 1500);
                }}
              >
                <View style={styles.rzIconWrap}><Ionicons name="card" size={24} color="#6366f1" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rzMethodTitle}>Card</Text>
                  <Text style={styles.rzMethodSub}>Visa, MasterCard, RuPay</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>

              {razorpayLoading && (
                <View style={styles.rzLoaderOverlay}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.rzLoaderText}>Processing Payment...</Text>
                </View>
              )}
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 24, paddingBottom: 60 },
  
  section: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  changeText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm, padding: 16 },
  
  addressRow: { flexDirection: 'row', gap: 16 },
  addressIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  addressInfo: { flex: 1 },
  addressTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  addressText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 2, lineHeight: 20 },
  distanceWarning: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.warningDark, marginTop: 4 },
  
  deliveryTypeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 10, ...Shadows.sm },
  deliveryTypeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  dtIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dtInfo: { flex: 1 },
  dtTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 2 },
  dtTitleActive: { color: Colors.primaryDark },
  dtSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  dtPrice: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  dtPriceActive: { color: Colors.primary },

  scheduledWrapper: { marginTop: 4, marginBottom: 10 },
  slotChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  slotChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  slotTextActive: { color: '#fff' },

  instructionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingVertical: 12 },
  instructionInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCardContent: { flexDirection: 'row', flex: 1, gap: 12, paddingRight: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successLight, justifyContent: 'center', alignItems: 'center' },
  rowCardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  rowCardDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
  
  billCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  billValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  billDiscountLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.successDark },
  billDiscountValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.successDark },
  billDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  billTotalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  billTotalValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primaryDark },

  paymentOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  paymentOptionActive: {},
  paymentOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  paymentTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.md },
  footerInfo: {},
  totalLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 2 },
  totalValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  payBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.full, minWidth: 160, alignItems: 'center', justifyContent: 'center', ...Shadows.glow },
  payBtnDisabled: { opacity: 0.7 },
  payBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // Razorpay UI Mock
  rzOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  rzSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, minHeight: height * 0.45 },
  rzHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 30 },
  rzLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  rzLogoText: { fontSize: 24, color: '#3b82f6', fontFamily: 'Inter_700Bold' },
  rzMerchant: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#64748b', marginBottom: 2 },
  rzAmount: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  rzSectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  rzMethod: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rzIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  rzMethodTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#1e293b', marginBottom: 2 },
  rzMethodSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748b' },
  rzLoaderOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  rzLoaderText: { marginTop: 12, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#3b82f6' },
});
