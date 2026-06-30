import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideOutRight } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';

export default function CartScreen() {
  const router = useRouter();
  const { cart, cartTotal, addToCart, removeFromCart, clearCart } = useCart();

  // Calculate GST Breakdown based on gstClass
  const { totalGST, gstBreakdown } = useMemo(() => {
    let tax = 0;
    const breakdown: Record<string, { taxable: number, taxAmount: number }> = {};
    
    cart.forEach(item => {
      const p = item.product;
      const qty = item.qty;
      const rate = p.gstClass === 'GST_5' ? 5 : p.gstClass === 'GST_12' ? 12 : p.gstClass === 'GST_18' ? 18 : p.gstClass === 'GST_28' ? 28 : 0;
      
      const totalItemValue = p.price * qty;
      const itemTax = (totalItemValue * rate) / (100 + rate);
      
      if (rate > 0) {
        if (!breakdown[`${rate}%`]) breakdown[`${rate}%`] = { taxable: 0, taxAmount: 0 };
        breakdown[`${rate}%`].taxable += (totalItemValue - itemTax);
        breakdown[`${rate}%`].taxAmount += itemTax;
      }
      
      tax += itemTax;
    });

    return { 
      totalGST: Math.round(tax * 100) / 100,
      gstBreakdown: breakdown
    };
  }, [cart]);

  const subtotal = cartTotal - totalGST;
  const deliveryFee = cartTotal > 199 ? 0 : 30; // Free delivery over 199
  const grandTotal = cartTotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added anything to your cart yet.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Info */}
        <View style={styles.deliveryInfoCard}>
          <View style={styles.deliveryIconBox}>
            <Ionicons name="time-outline" size={20} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.deliveryInfoTitle}>Delivery in 15-30 mins</Text>
            <Text style={styles.deliveryInfoText}>From Basko Local Store</Text>
          </View>
        </View>

        {/* Cart Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Items ({cart.length})</Text>
          {cart.map((item, index) => (
            <Animated.View 
              key={item.product.id} 
              entering={FadeInDown.delay(index * 50).springify()}
              exiting={SlideOutRight}
              style={styles.cartItem}
            >
              <Image source={{ uri: item.product.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>₹{item.product.price}</Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.product.id)}>
                  <Ionicons name={item.qty === 1 ? "trash-outline" : "remove"} size={16} color={item.qty === 1 ? Colors.danger : Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item.product)}>
                  <Ionicons name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Coupon Section */}
        <TouchableOpacity style={styles.couponCard} activeOpacity={0.8}>
          <View style={styles.couponLeft}>
            <Ionicons name="pricetag-outline" size={20} color={Colors.success} />
            <Text style={styles.couponText}>Apply Coupon</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && styles.freeText]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          {deliveryFee > 0 && (
            <Text style={styles.deliveryPromo}>Add ₹{(200 - cartTotal).toFixed(2)} more for free delivery</Text>
          )}

          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.billLabel}>Taxes & Charges (GST)</Text>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            </View>
            <Text style={styles.billValue}>₹{totalGST.toFixed(2)}</Text>
          </View>

          {/* GST Breakdown (Optional detailed view) */}
          {Object.keys(gstBreakdown).length > 0 && (
            <View style={styles.gstBreakdownBox}>
              {Object.entries(gstBreakdown).map(([rate, data]) => (
                <View key={rate} style={styles.gstBreakdownRow}>
                  <Text style={styles.gstBreakdownLabel}>GST @ {rate} on ₹{data.taxable.toFixed(2)}</Text>
                  <Text style={styles.gstBreakdownValue}>₹{data.taxAmount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />
          
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>PAYING</Text>
          <Text style={styles.footerTotalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Pay</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  clearText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.danger },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  
  deliveryInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, gap: 16, ...Shadows.sm },
  deliveryIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  deliveryInfoTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  deliveryInfoText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  itemsCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemImage: { width: 60, height: 60, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 6 },
  itemPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primaryLight },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, width: 24, textAlign: 'center' },
  
  couponCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, ...Shadows.sm },
  couponLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  couponText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  
  billCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  billLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  billValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  freeText: { color: Colors.success },
  deliveryPromo: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.accent, marginTop: -8, marginBottom: 12 },
  gstBreakdownBox: { backgroundColor: Colors.surfaceAlt, padding: 12, borderRadius: Radius.md, marginTop: 4, marginBottom: 12, gap: 6 },
  gstBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gstBreakdownLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  gstBreakdownValue: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12, borderStyle: 'dashed' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  grandTotalValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.md },
  footerTotal: {},
  footerTotalLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  footerTotalValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full, ...Shadows.glow },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 10 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: Radius.full, ...Shadows.glow },
  shopBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
