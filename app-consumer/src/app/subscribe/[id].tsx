import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Switch, Modal, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, FadeIn, FadeOut, SlideOutDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';

const { height } = Dimensions.get('window');

export default function SubscribeCheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [agreedToAutoPay, setAgreedToAutoPay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Razorpay Mock State
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`)
      .then(res => res.json())
      .then(data => {
        const item = data.find((p: any) => p.id === id);
        if (item) {
          setProduct({
            id: item.id,
            name: item.name,
            price: item.sellingPrice,
            image: item.imageUrl || 'https://via.placeholder.com/300',
            subscriptionDiscount: item.subscriptionDiscount || 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubscribe = () => {
    if (!agreedToAutoPay) return;
    setShowRazorpay(true);
  };

  const processSubscription = () => {
    setIsProcessing(true);
    setRazorpayLoading(false);
    setShowRazorpay(false);
    
    // Simulate API call for subscription setup
    setTimeout(() => {
      setIsProcessing(false);
      router.replace(`/subscribe-confirmation?productId=${product?.id}&frequency=${frequency}`);
    }, 1500);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: Colors.textSecondary }}>Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const originalPrice = product.price;
  const discountAmount = (originalPrice * (product.subscriptionDiscount / 100));
  const finalPrice = originalPrice - discountAmount;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Subscription</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Product Summary */}
        <Animated.View entering={SlideInDown.delay(50)} style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={styles.imageBox}>
              <Ionicons name="cart" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={styles.productPrice}>₹{originalPrice.toFixed(2)} / unit</Text>
            </View>
          </View>
        </Animated.View>

        {/* Frequency */}
        <Animated.View entering={SlideInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Frequency</Text>
          <View style={styles.freqRow}>
            <TouchableOpacity 
              style={[styles.freqCard, frequency === 'DAILY' && styles.freqCardActive]}
              onPress={() => setFrequency('DAILY')}
            >
              <Ionicons name="calendar-outline" size={24} color={frequency === 'DAILY' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.freqTitle, frequency === 'DAILY' && styles.freqTitleActive]}>Daily</Text>
              <Text style={styles.freqSub}>Every morning</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.freqCard, frequency === 'WEEKLY' && styles.freqCardActive]}
              onPress={() => setFrequency('WEEKLY')}
            >
              <Ionicons name="calendar-clear-outline" size={24} color={frequency === 'WEEKLY' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.freqTitle, frequency === 'WEEKLY' && styles.freqTitleActive]}>Weekly</Text>
              <Text style={styles.freqSub}>Once a week</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Auto Pay Agreement */}
        <Animated.View entering={SlideInDown.delay(150)} style={styles.section}>
          <View style={[styles.card, styles.rowCard, { borderColor: agreedToAutoPay ? Colors.primary : Colors.borderLight }]}>
            <View style={styles.rowCardContent}>
              <View style={[styles.iconBox, { backgroundColor: agreedToAutoPay ? Colors.primaryGhost : Colors.surfaceAlt }]}>
                <Ionicons name="card" size={20} color={agreedToAutoPay ? Colors.primary : Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowCardTitle}>Enable Auto-Pay</Text>
                <Text style={styles.rowCardDesc}>I agree to automatic recurring charges to my default payment method for this subscription.</Text>
              </View>
            </View>
            <Switch 
              value={agreedToAutoPay} 
              onValueChange={setAgreedToAutoPay} 
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor="#fff"
            />
          </View>
        </Animated.View>

        {/* Pricing Summary */}
        <Animated.View entering={SlideInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Recurring Summary</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Standard Price</Text>
              <Text style={styles.billValue}>₹{originalPrice.toFixed(2)}</Text>
            </View>
            
            <View style={styles.billRow}>
              <Text style={styles.billDiscountLabel}>Subscription Savings ({product.subscriptionDiscount}%)</Text>
              <Text style={styles.billDiscountValue}>-₹{discountAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.billDivider} />
            
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Recurring Total / Delivery</Text>
              <Text style={styles.billTotalValue}>₹{finalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.totalLabel}>Amount to pay now</Text>
          <Text style={styles.totalValue}>₹0.00</Text>
        </View>
        <TouchableOpacity 
          style={[styles.payBtn, (!agreedToAutoPay || isProcessing) && styles.payBtnDisabled]} 
          onPress={handleSubscribe} 
          disabled={!agreedToAutoPay || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Animated.View entering={FadeIn} style={styles.payBtnContent}>
              <Text style={styles.payBtnText}>Subscribe</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
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
                  <Text style={styles.rzMerchant}>Basko Subscription Setup</Text>
                  <Text style={styles.rzAmount}>Autopay Mandate</Text>
                </View>
              </View>

              <Text style={styles.rzSectionTitle}>Link Payment Method</Text>
              
              <TouchableOpacity 
                style={styles.rzMethod}
                onPress={() => {
                  setRazorpayLoading(true);
                  setTimeout(() => { processSubscription(); }, 1500);
                }}
              >
                <View style={styles.rzIconWrap}><Ionicons name="qr-code" size={24} color="#3b82f6" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rzMethodTitle}>UPI AutoPay</Text>
                  <Text style={styles.rzMethodSub}>Google Pay, PhonePe, Paytm</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rzMethod}
                onPress={() => {
                  setRazorpayLoading(true);
                  setTimeout(() => { processSubscription(); }, 1500);
                }}
              >
                <View style={styles.rzIconWrap}><Ionicons name="card" size={24} color="#6366f1" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rzMethodTitle}>Credit Card</Text>
                  <Text style={styles.rzMethodSub}>Visa, MasterCard, RuPay</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>

              {razorpayLoading && (
                <View style={styles.rzLoaderOverlay}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.rzLoaderText}>Registering Mandate...</Text>
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
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
  imageBox: { width: 50, height: 50, borderRadius: Radius.md, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  productPrice: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  freqRow: { flexDirection: 'row', gap: 12 },
  freqCard: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.lg, padding: 16, alignItems: 'center', ...Shadows.sm },
  freqCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  freqTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 8, marginBottom: 2 },
  freqTitleActive: { color: Colors.primaryDark },
  freqSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCardContent: { flexDirection: 'row', flex: 1, gap: 12, paddingRight: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  rowCardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  rowCardDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
  
  billCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  billValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  billDiscountLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.successDark },
  billDiscountValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.successDark },
  billDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  billTotalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  billTotalValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.primaryDark },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.md },
  footerInfo: {},
  totalLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 2 },
  totalValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  payBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', ...Shadows.glow },
  payBtnDisabled: { opacity: 0.5, backgroundColor: Colors.textMuted },
  payBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // Razorpay UI Mock
  rzOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  rzSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, minHeight: height * 0.45 },
  rzHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 30 },
  rzLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  rzLogoText: { fontSize: 24, color: '#3b82f6', fontFamily: 'Inter_700Bold' },
  rzMerchant: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#64748b', marginBottom: 2 },
  rzAmount: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  rzSectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  rzMethod: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rzIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  rzMethodTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#1e293b', marginBottom: 2 },
  rzMethodSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748b' },
  rzLoaderOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  rzLoaderText: { marginTop: 12, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#3b82f6' },
});
