import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId || '#ORD-8924';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.iconText}>✓</Text>
        </Animated.View>
        <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>Your groceries are being packed and will arrive in 10-15 minutes.</Text>
          
          <View style={styles.detailsCard}>
            <Text style={styles.detailsLabel}>Order ID</Text>
            <Text style={styles.detailsValue}>{orderId}</Text>
          <View style={styles.divider} />
          <Text style={styles.detailsLabel}>Total Amount</Text>
          <Text style={styles.detailsValue}>₹235.00</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: opacityAnim }]}>
        <TouchableOpacity style={styles.trackBtn} onPress={() => { const displayOrderId = (Array.isArray(orderId) ? orderId[0] : orderId)?.replace(/-/g, '').substring(0, 8).toUpperCase() || '12345678'; router.replace(`/delivery-tracking?orderId=${displayOrderId.replace('#', '')}`) }}>
          <Text style={styles.trackBtnText}>Track Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconText: { fontSize: 40, color: '#16a34a', fontWeight: 'bold' },
  title: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: '#111827', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#6b7280', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  detailsCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 20, width: '100%', alignItems: 'center' },
  detailsLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6b7280', marginBottom: 5 },
  detailsValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#111827' },
  divider: { height: 1, backgroundColor: '#e5e7eb', width: '100%', marginVertical: 15 },
  footer: { padding: 20, paddingBottom: 40 },
  trackBtn: { backgroundColor: ROYAL_BLUE, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  trackBtnText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_700Bold' },
  homeBtn: { backgroundColor: '#f3f4f6', padding: 18, borderRadius: 12, alignItems: 'center' },
  homeBtnText: { color: '#4b5563', fontSize: 16, fontFamily: 'Inter_700Bold' }
});
