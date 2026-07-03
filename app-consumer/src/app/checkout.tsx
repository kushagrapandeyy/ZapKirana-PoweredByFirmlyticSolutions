import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5'; // Mock User

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [deliverySlot, setDeliverySlot] = useState<'ASAP' | '10_12' | '14_16' | '18_20'>('ASAP');
  const [isProcessing, setIsProcessing] = useState(false);
  const [requireOtp, setRequireOtp] = useState(false);
  const [instructions, setInstructions] = useState('');

  const deliveryFee = cartTotal > 199 ? 0 : 30;
  const grandTotal = cartTotal + deliveryFee;

  const handlePayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const storeId = await AsyncStorage.getItem('@selected_store_id') || CURRENT_STORE_ID;

      const orderPayload = {
        storeId,
        customerId: CURRENT_CUSTOMER_ID,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.qty })),
        delivery: {
          address: 'Tower A, Flat 402, Sunshine Residences',
          lat: 12.9750,
          lng: 77.5950
        },
        deliverySlot,
        requireOtp,
        deliveryInstructions: instructions
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const orderData = await res.json();
        
        // Mock payment step: Always mark as paid/confirmed so it appears in the Vendor App's incoming queue
        await fetch(`${API_BASE_URL}/orders/${orderData.id}/pay`, { method: 'POST' });

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
        <Animated.View entering={SlideInDown.delay(100)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <View style={styles.addressRow}>
              <View style={styles.addressIcon}>
                <Ionicons name="home" size={20} color={Colors.primary} />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>Home</Text>
                <Text style={styles.addressText}>Tower A, Flat 402, Sunshine Residences</Text>
                <Text style={styles.addressText}>Sector 45, Bangalore</Text>
                <Text style={styles.phoneText}>+91 98765 43210</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Delivery Slot */}
        <Animated.View entering={SlideInDown.delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll} contentContainerStyle={styles.slotContent}>
            {[
              { id: 'ASAP', label: '15-30 mins', icon: 'flash' },
              { id: '10_12', label: '10:00 - 12:00', icon: 'sunny' },
              { id: '14_16', label: '14:00 - 16:00', icon: 'partly-sunny' },
              { id: '18_20', label: '18:00 - 20:00', icon: 'moon' }
            ].map(slot => (
              <TouchableOpacity 
                key={slot.id}
                style={[styles.slotChip, deliverySlot === slot.id && styles.slotChipActive]}
                onPress={() => setDeliverySlot(slot.id as any)}
              >
                <Ionicons 
                  name={slot.icon as any} 
                  size={16} 
                  color={deliverySlot === slot.id ? Colors.primary : Colors.textMuted} 
                />
                <Text style={[styles.slotText, deliverySlot === slot.id && styles.slotTextActive]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Delivery Options */}
        <Animated.View entering={SlideInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          
          <View style={[styles.card, styles.instructionCard]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.textMuted} />
            <TextInput 
              style={styles.instructionInput} 
              placeholder="Add instructions for delivery partner (e.g. Leave at door)"
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

        {/* Payment Method */}
        <Animated.View entering={SlideInDown.delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'UPI' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('UPI')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="qr-code" size={24} color={paymentMethod === 'UPI' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.paymentText, paymentMethod === 'UPI' && styles.paymentTextActive]}>UPI (GPay, PhonePe)</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'UPI' && styles.radioActive]}>
                {paymentMethod === 'UPI' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'CARD' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('CARD')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="card" size={24} color={paymentMethod === 'CARD' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.paymentText, paymentMethod === 'CARD' && styles.paymentTextActive]}>Credit / Debit Card</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'CARD' && styles.radioActive]}>
                {paymentMethod === 'CARD' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'CASH' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('CASH')}
            >
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
          onPress={handlePayment} 
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 24 },
  
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
  phoneText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 4 },
  
  slotScroll: { marginHorizontal: -16 },
  slotContent: { paddingHorizontal: 16, gap: 12 },
  slotChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  slotChipActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  slotText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  slotTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  
  instructionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingVertical: 12 },
  instructionInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCardContent: { flexDirection: 'row', flex: 1, gap: 12, paddingRight: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successLight, justifyContent: 'center', alignItems: 'center' },
  rowCardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  rowCardDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
  
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
});
